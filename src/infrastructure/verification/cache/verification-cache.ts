import type { VerificationRecord, VerificationStatus } from '../models.js';

// ─── Verification cache interface ─────────────────────────────────────────────
// An ephemeral key-value store for VerificationRecord instances.
// Implementations must never write to the database. The cache is intentionally
// scoped to the lifetime of the verification attempt, not the identity.
//
// Lifecycle contract:
// • store()  — persist a new record; overwrites any existing record with the same id.
// • fetch()  — retrieve a live record; returns undefined if the record does not
//              exist OR has passed its expiresAt. Expired records may be evicted.
// • update() — transition the status of a stored record.
//              Returns true if the record was found, live, and updated.
//              Returns false if the record was absent or expired.
//              Callers must treat false as a signal that the update was not applied
//              and handle it explicitly — silent discard is not permitted.
// • delete() — remove a record unconditionally (used on consumption or abort).
export interface VerificationCache {
  store(record: VerificationRecord): Promise<void>;

  fetch(id: string): Promise<VerificationRecord | undefined>;

  update(id: string, status: VerificationStatus): Promise<boolean>;

  delete(id: string): Promise<void>;
}
