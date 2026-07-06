import { randomUUID } from 'node:crypto';

import { defaultVerificationPolicy } from '../policy.js';

// ─── Dual verification session ────────────────────────────────────────────────
// Tracks the state of both phone and email verifications that must both
// succeed before a TMP constitutional identity can be created.
// Sessions are ephemeral — they exist only in the in-process store and
// expire when their OTPs expire.
export interface DualVerificationSession {
  readonly id: string;

  // Verification IDs issued by the VerificationEngine (Sprint 4B).
  readonly phoneVerificationId: string;
  readonly emailVerificationId: string;

  // Normalised contact values held here so the repository can write them
  // to identity_verified_contacts inside the transaction without re-reading
  // the cache.
  readonly phone: string; // E.164
  readonly email: string; // lowercase

  // Confirmation flags — set to true when the engine.verify() call for the
  // respective channel succeeds.
  readonly phoneConfirmed: boolean;
  readonly emailConfirmed: boolean;

  readonly createdAt: Date;
  readonly expiresAt: Date;
}

// ─── Session store interface ──────────────────────────────────────────────────
export interface DualVerificationSessionStore {
  create(session: DualVerificationSession): void;

  // Look up a session by either of its two verification IDs.
  findByVerificationId(verificationId: string): DualVerificationSession | undefined;

  update(session: DualVerificationSession): void;

  delete(sessionId: string): void;
}

// ─── In-process session store ─────────────────────────────────────────────────
// Map-based implementation. Two indices maintained: one by session ID
// and one by verification ID (for O(1) look-up from either OTP confirm).
// Lazy expiry: expired sessions are evicted on read.
export function createDualVerificationSessionStore(): DualVerificationSessionStore {
  const bySessionId = new Map<string, DualVerificationSession>();

  // Each session has two verification IDs; both map to the session ID.
  const byVerificationId = new Map<string, string>();

  function isExpired(session: DualVerificationSession): boolean {
    return session.expiresAt <= new Date();
  }

  function evict(session: DualVerificationSession): void {
    byVerificationId.delete(session.phoneVerificationId);
    byVerificationId.delete(session.emailVerificationId);
    bySessionId.delete(session.id);
  }

  return {
    create(session: DualVerificationSession): void {
      bySessionId.set(session.id, session);
      byVerificationId.set(session.phoneVerificationId, session.id);
      byVerificationId.set(session.emailVerificationId, session.id);
    },

    findByVerificationId(verificationId: string): DualVerificationSession | undefined {
      const sessionId = byVerificationId.get(verificationId);
      if (sessionId === undefined) return undefined;

      const session = bySessionId.get(sessionId);
      if (session === undefined) return undefined;

      if (isExpired(session)) {
        evict(session);
        return undefined;
      }

      return session;
    },

    update(session: DualVerificationSession): void {
      bySessionId.set(session.id, session);
    },

    delete(sessionId: string): void {
      const session = bySessionId.get(sessionId);
      if (session !== undefined) {
        evict(session);
      }
    },
  };
}

// ─── Session factory ──────────────────────────────────────────────────────────
export function createDualVerificationSession(params: {
  phoneVerificationId: string;
  emailVerificationId: string;
  phone: string;
  email: string;
  ttlSeconds?: number;
}): DualVerificationSession {
  const now = new Date();
  const ttl = params.ttlSeconds ?? defaultVerificationPolicy.ttlSeconds;

  return {
    id: randomUUID(),
    phoneVerificationId: params.phoneVerificationId,
    emailVerificationId: params.emailVerificationId,
    phone: params.phone,
    email: params.email,
    phoneConfirmed: false,
    emailConfirmed: false,
    createdAt: now,
    expiresAt: new Date(now.getTime() + ttl * 1000),
  };
}
