// ─── Tattvaloka domain models ──────────────────────────────────────────────────
// Read-side domain shape and input types for the Tattvaloka application layer.

// The full read model for a Tattvaloka participant record.
export interface TattvalokaParticipant {
  readonly id: string;
  readonly identityId: string;
  readonly joinedAt: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
