import { randomUUID } from 'node:crypto';

import type { VerificationInfrastructure } from '../../infrastructure/verification/container.js';
import type { ContactChannel } from '../../infrastructure/verification/models.js';
import { EngineError, EngineErrorCode } from './errors.js';
import { isEngineRecord, type EngineVerificationRecord } from './models.js';
import { generateOtp } from './otp/generate.js';
import { hashOtp, verifyOtp } from './otp/hash.js';
import { defaultVerificationPolicy, type VerificationPolicy } from './policy.js';

// ─── Verification engine interface ───────────────────────────────────────────
// The public contract for verification lifecycle management.
// All methods are pure with respect to the database — no Drizzle, no SQL.
// State lives exclusively in the VerificationCache supplied at construction.
export interface VerificationEngine {
  // Begin a new verification for the given channel.
  // Generates an OTP, stores a hashed record in the cache, dispatches the
  // message via the provider, and returns the verification id.
  // Throws VerificationError (from the provider) if the send fails.
  initiate(channel: ContactChannel): Promise<string>;

  // Submit an OTP candidate against an existing verification record.
  // Increments the attempt counter before comparing the hash so that a
  // crash mid-verify still counts the attempt.
  // Throws EngineError on every failure condition; resolves on success.
  verify(id: string, otp: string): Promise<void>;

  // Request a new OTP for an existing verification id.
  // The same id is reused; the OTP hash, attempt counter, and expiry are
  // reset. The previous record is restored in the cache if the provider
  // send fails, ensuring the caller can retry.
  // Throws EngineError if the record is absent, consumed, or within cooldown.
  resend(id: string): Promise<void>;
}

// ─── Message composition ─────────────────────────────────────────────────────
// Produces the subject and body delivered to the contact channel.
// Kept private to the engine — callers never supply or see the OTP plaintext.
function composeMessage(
  channel: ContactChannel,
  otp: string,
  ttlMinutes: number,
): { subject: string; body: string } {
  const subject = 'Your verification code';

  const body =
    channel.type === 'phone'
      ? `Your verification code is: ${otp}`
      : `Your verification code is: ${otp}\n\nThis code expires in ${ttlMinutes} minute(s).`;

  return { subject, body };
}

// ─── Engine factory ───────────────────────────────────────────────────────────
// Constructs a VerificationEngine bound to the supplied infrastructure and policy.
// Passing a policy override replaces the full default; individual fields are not
// merged — supply a complete VerificationPolicy if overriding.
export function createVerificationEngine(
  infrastructure: VerificationInfrastructure,
  policy: VerificationPolicy = defaultVerificationPolicy,
): VerificationEngine {
  const ttlMinutes = policy.ttlSeconds / 60;

  // ─── initiate ──────────────────────────────────────────────────────────────
  async function initiate(channel: ContactChannel): Promise<string> {
    const id = randomUUID();
    const otp = generateOtp(policy.otpLength);
    const now = new Date();

    const record: EngineVerificationRecord = {
      id,
      channel,
      status: 'pending',
      createdAt: now,
      expiresAt: new Date(now.getTime() + policy.ttlSeconds * 1000),
      otpHash: hashOtp(otp, id),
      attempts: 0,
      lastSentAt: now,
    };

    await infrastructure.cache.store(record);

    try {
      await infrastructure.provider.send(
        channel,
        composeMessage(channel, otp, ttlMinutes),
      );
    } catch (error) {
      // Remove the record so a retry can initiate cleanly without leaking
      // a stale pending entry in the cache.
      await infrastructure.cache.delete(id);
      throw error;
    }

    // Record confirmed delivered. If update returns false the record was
    // evicted in the window between store() and update() — an extremely
    // narrow race. The send succeeded but no live record remains, so the
    // caller cannot complete verification. Treat as a failed initiation
    // rather than silently returning an id that will always yield NOT_FOUND.
    const delivered = await infrastructure.cache.update(id, 'delivered');
    if (!delivered) {
      throw new EngineError(
        'Verification record expired immediately after send.',
        EngineErrorCode.NOT_FOUND,
      );
    }

    return id;
  }

  // ─── verify ────────────────────────────────────────────────────────────────
  async function verify(id: string, otp: string): Promise<void> {
    const base = await infrastructure.cache.fetch(id);

    if (base === undefined || !isEngineRecord(base)) {
      throw new EngineError(
        'Verification record not found or expired.',
        EngineErrorCode.NOT_FOUND,
      );
    }

    if (base.status === 'consumed') {
      throw new EngineError(
        'This verification has already been used.',
        EngineErrorCode.ALREADY_CONSUMED,
      );
    }

    if (base.attempts >= policy.maxAttempts) {
      throw new EngineError(
        'Maximum verification attempts exceeded.',
        EngineErrorCode.MAX_ATTEMPTS_EXCEEDED,
      );
    }

    // Increment the attempt counter and persist it before comparing the OTP.
    // This ensures a crash between the store and the comparison still counts
    // the attempt, preventing an attacker from retrying indefinitely by
    // terminating the process at a precise moment.
    const withIncrementedAttempts: EngineVerificationRecord = {
      ...base,
      attempts: base.attempts + 1,
    };
    await infrastructure.cache.store(withIncrementedAttempts);

    if (!verifyOtp(otp, base.otpHash, id)) {
      // Newly incremented count may have hit the limit on this attempt.
      if (withIncrementedAttempts.attempts >= policy.maxAttempts) {
        throw new EngineError(
          'Maximum verification attempts exceeded.',
          EngineErrorCode.MAX_ATTEMPTS_EXCEEDED,
        );
      }

      throw new EngineError(
        'Invalid verification code.',
        EngineErrorCode.INVALID_OTP,
      );
    }

    // OTP correct — consume the record. If update returns false the record
    // expired in the narrow window between the fetch and now; treat as
    // not found since the record is gone regardless.
    const consumed = await infrastructure.cache.update(id, 'consumed');
    if (!consumed) {
      throw new EngineError(
        'Verification record not found or expired.',
        EngineErrorCode.NOT_FOUND,
      );
    }
  }

  // ─── resend ────────────────────────────────────────────────────────────────
  async function resend(id: string): Promise<void> {
    const base = await infrastructure.cache.fetch(id);

    if (base === undefined || !isEngineRecord(base)) {
      throw new EngineError(
        'Verification record not found or expired.',
        EngineErrorCode.NOT_FOUND,
      );
    }

    if (base.status === 'consumed') {
      throw new EngineError(
        'This verification has already been used.',
        EngineErrorCode.ALREADY_CONSUMED,
      );
    }

    const now = new Date();
    const cooldownExpiry = new Date(
      base.lastSentAt.getTime() + policy.resendCooldownSeconds * 1000,
    );

    if (now < cooldownExpiry) {
      const remainingSeconds = Math.ceil(
        (cooldownExpiry.getTime() - now.getTime()) / 1000,
      );
      throw new EngineError(
        `Resend not available for another ${remainingSeconds} second(s).`,
        EngineErrorCode.RESEND_COOLDOWN_ACTIVE,
      );
    }

    const otp = generateOtp(policy.otpLength);

    // Reset the record: new OTP hash, cleared attempt counter, extended
    // expiry, updated lastSentAt. createdAt is preserved to record when
    // the verification was first initiated.
    const refreshed: EngineVerificationRecord = {
      ...base,
      status: 'pending',
      otpHash: hashOtp(otp, id),
      attempts: 0,
      lastSentAt: now,
      expiresAt: new Date(now.getTime() + policy.ttlSeconds * 1000),
    };

    await infrastructure.cache.store(refreshed);

    try {
      await infrastructure.provider.send(
        base.channel,
        composeMessage(base.channel, otp, ttlMinutes),
      );
    } catch (error) {
      // Restore the previous record so the caller can retry the resend
      // rather than finding a stale pending entry with no valid OTP.
      await infrastructure.cache.store(base);
      throw error;
    }

    const delivered = await infrastructure.cache.update(id, 'delivered');
    if (!delivered) {
      throw new EngineError(
        'Verification record expired immediately after send.',
        EngineErrorCode.NOT_FOUND,
      );
    }
  }

  return { initiate, verify, resend };
}
