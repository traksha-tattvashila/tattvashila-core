// ─── Tattvapeetha domain models ─────────────────────────────────────────────────
// Read-side domain shape for the Tattvapeetha constitutional foundation.

// ─── TattvapeethaEntity ──────────────────────────────────────────────────────────
// The full read model for a Tattvapeetha constitutional entity: its
// permanent internal UUID and the single institution (INS) that owns it.
//
// `id` is the permanent internal continuity key and is never used as a
// public-facing identifier — external lookup happens via the owning
// institution's INS identifier (see http/routes.ts).
// `institutionId` is the UUID of the exactly-one owning institution
// (never ambiguous, never plural) — this entity resolves to that
// institution and no other.
export interface TattvapeethaEntity {
  readonly id: string;
  readonly institutionId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
