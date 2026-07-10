// ─── Tattvaloka membership domain models ────────────────────────────────────────
// Read-side domain shape for the Tattvaloka membership application layer.

// The full read model for a Tattvaloka membership record.
export interface TattvalokaMembership {
  readonly id: string;
  readonly identityId: string;
  readonly memberSince: Date;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
