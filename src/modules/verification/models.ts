import type { VerificationRecord } from '../../infrastructure/verification/models.js';

// ─── Engine verification record ───────────────────────────────────────────────
// Extends the infrastructure VerificationRecord with the additional fields
// required by the verification engine.
//
// Sprint 4A's VerificationRecord is intentionally minimal (id, channel, status,
// timestamps). The engine adds the fields it owns — OTP hash, attempt counter,
// and last-sent timestamp — without modifying the frozen infrastructure type.
//
// TypeScript's structural typing means EngineVerificationRecord satisfies the
// VerificationRecord constraint, so it can be stored in a VerificationCache
// without a cast. The engine always writes EngineVerificationRecord instances
// and narrows fetched records via isEngineRecord() before trusting engine fields.
export interface EngineVerificationRecord extends VerificationRecord {
  // SHA-256 hex digest of the OTP, salted with the record id.
  // Never the plaintext OTP.
  readonly otpHash: string;

  // Number of unsuccessful verify() calls made against this record.
  // Incremented before OTP comparison; stored in the cache atomically with
  // the comparison so a crash mid-verify counts the attempt.
  readonly attempts: number;

  // Timestamp of the most recent send (initiate or resend).
  // Used to enforce the resend cooldown independently of createdAt, which
  // records when the verification was first initiated and never changes.
  readonly lastSentAt: Date;
}

// ─── Type guard ───────────────────────────────────────────────────────────────
// Narrows a VerificationRecord to EngineVerificationRecord by checking for
// the presence and types of the engine-specific fields.
// Use this after every cache fetch before accessing engine fields.
export function isEngineRecord(
  record: VerificationRecord,
): record is EngineVerificationRecord {
  const r = record as Partial<EngineVerificationRecord>;
  return (
    typeof r.otpHash === 'string' &&
    typeof r.attempts === 'number' &&
    r.lastSentAt instanceof Date
  );
}
