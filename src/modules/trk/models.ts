// ─── TRK domain models ─────────────────────────────────────────────────────────
// Read-side domain shapes for the identity application layer.
// These are distinct from CreatedIdentity (repository.ts), which is the
// minimal shape returned immediately after Sprint 5's TMP issuance and does
// not carry contact records.

// ─── Verified contact type ───────────────────────────────────────────────────
// Mirrors the `contact_type` enum defined in the TRK constitutional schema.
export type ContactType = 'phone' | 'email';

// ─── Verified contact ─────────────────────────────────────────────────────────
// A single verified contact attribute linked to an identity.
export interface VerifiedContact {
  readonly type: ContactType;
  readonly value: string;
}

// ─── Identity ─────────────────────────────────────────────────────────────────
// The full read model for a constitutional identity: its state, every
// verified contact linked to it, and its record timestamps.
export interface Identity {
  readonly id: string;
  readonly state: string;
  readonly contacts: readonly VerifiedContact[];
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
