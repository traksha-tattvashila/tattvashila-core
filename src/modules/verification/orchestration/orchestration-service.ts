import type { Logger } from '../../../foundation/logger.js';
import type { RecordLock } from '../../../infrastructure/concurrency/record-lock.js';
import type { VerificationEngine } from '../engine.js';
import { EngineError, EngineErrorCode } from '../errors.js';
import type { CreatedIdentity, TrkRepository } from '../../trk/repository.js';
import {
  createDualVerificationSession,
  type DualVerificationSession,
  type DualVerificationSessionStore,
} from './session.js';

// ─── Result types ─────────────────────────────────────────────────────────────

export interface InitiateResult {
  readonly sessionId: string;
  readonly phoneVerificationId: string;
  readonly emailVerificationId: string;
}

export interface ConfirmResult {
  readonly sessionComplete: boolean;
  readonly identity?: CreatedIdentity;
}

// ─── Orchestration service interface ─────────────────────────────────────────
// Coordinates dual-channel verification and the constitutional TMP issuance
// that follows. All cache operations are delegated to the VerificationEngine;
// database writes are delegated to the TrkRepository.
export interface VerificationOrchestrationService {
  // Initiate a dual verification session.
  // Sends an OTP to both the phone and email channels concurrently.
  // Returns the session ID (for client tracking) and both verification IDs
  // (each submitted separately to the confirm endpoint).
  initiate(phone: string, email: string): Promise<InitiateResult>;

  // Confirm an OTP for one channel in an existing session.
  // When BOTH channels have been confirmed, creates the TMP constitutional
  // identity, its verified contact records, and operational metadata inside
  // a single database transaction.
  // Throws EngineError for all OTP-level failures; AppError for constraint
  // violations at the database level.
  confirm(verificationId: string, otp: string): Promise<ConfirmResult>;
}

// ─── Dependencies ─────────────────────────────────────────────────────────────
export interface OrchestrationServiceDeps {
  engine: VerificationEngine;
  sessionStore: DualVerificationSessionStore;
  trkRepository: TrkRepository;
  sessionLock: RecordLock;
  logger: Logger;
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createVerificationOrchestrationService(
  deps: OrchestrationServiceDeps,
): VerificationOrchestrationService {
  const { engine, sessionStore, trkRepository, sessionLock, logger } = deps;

  // ─── initiate ──────────────────────────────────────────────────────────────
  async function initiate(phone: string, email: string): Promise<InitiateResult> {
    // Send OTPs to both channels concurrently. If either send fails, the
    // successfully initiated record expires naturally via its TTL — no
    // cleanup required since nothing has been written to the database.
    const [phoneVerificationId, emailVerificationId] = await Promise.all([
      engine.initiate({ type: 'phone', value: phone }),
      engine.initiate({ type: 'email', value: email }),
    ]);

    const session = createDualVerificationSession({
      phoneVerificationId,
      emailVerificationId,
      phone,
      email,
    });

    sessionStore.create(session);

    logger.info('Dual verification session created', {
      sessionId: session.id,
      phoneVerificationId,
      emailVerificationId,
    });

    return {
      sessionId: session.id,
      phoneVerificationId,
      emailVerificationId,
    };
  }

  // ─── confirm ───────────────────────────────────────────────────────────────
  async function confirm(verificationId: string, otp: string): Promise<ConfirmResult> {
    // Resolve the session before acquiring the lock so we have its ID.
    const session = sessionStore.findByVerificationId(verificationId);
    if (session === undefined) {
      throw new EngineError(
        'Verification record not found or expired.',
        EngineErrorCode.NOT_FOUND,
      );
    }

    // Serialise concurrent confirm requests on the same session to prevent
    // attempt-count races (Option B per Sprint 4B architectural decision).
    return sessionLock.withLock(session.id, async () => confirmLocked(verificationId, otp));
  }

  // Runs inside the session lock — safe to read-modify-write session state.
  async function confirmLocked(
    verificationId: string,
    otp: string,
  ): Promise<ConfirmResult> {
    // Re-fetch after lock acquisition; state may have changed while waiting.
    const current = sessionStore.findByVerificationId(verificationId);
    if (current === undefined) {
      throw new EngineError(
        'Verification record not found or expired.',
        EngineErrorCode.NOT_FOUND,
      );
    }

    const isPhone = current.phoneVerificationId === verificationId;
    const isEmail = current.emailVerificationId === verificationId;

    // Guard against submitting the same channel twice.
    if (isPhone && current.phoneConfirmed) {
      throw new EngineError(
        'Phone verification has already been used.',
        EngineErrorCode.ALREADY_CONSUMED,
      );
    }
    if (isEmail && current.emailConfirmed) {
      throw new EngineError(
        'Email verification has already been used.',
        EngineErrorCode.ALREADY_CONSUMED,
      );
    }

    // Delegate OTP comparison to the engine — this increments the attempt
    // counter and marks the record as consumed on success.
    await engine.verify(verificationId, otp);

    const updated: DualVerificationSession = {
      ...current,
      phoneConfirmed: isPhone ? true : current.phoneConfirmed,
      emailConfirmed: isEmail ? true : current.emailConfirmed,
    };

    sessionStore.update(updated);

    logger.info('Channel verified', {
      sessionId: current.id,
      channel: isPhone ? 'phone' : 'email',
      sessionComplete: updated.phoneConfirmed && updated.emailConfirmed,
    });

    // ── Constitutional rule ────────────────────────────────────────────────
    // A TMP identity is created only after BOTH channels have been confirmed.
    // All three database writes occur inside a single transaction; if any
    // write fails, the transaction is rolled back and no identity is created.
    if (updated.phoneConfirmed && updated.emailConfirmed) {
      const identity = await trkRepository.createIdentityWithContacts({
        phone: updated.phone,
        email: updated.email,
      });

      // Session fulfilled — remove it from the store.
      sessionStore.delete(updated.id);

      logger.info('Constitutional TMP identity created', {
        identityId: identity.id,
        sessionId: updated.id,
      });

      return { sessionComplete: true, identity };
    }

    return { sessionComplete: false };
  }

  return { initiate, confirm };
}
