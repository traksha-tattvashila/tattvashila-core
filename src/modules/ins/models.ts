// ─── Institution domain models ─────────────────────────────────────────────────
// Read-side domain shape for the institution application layer.

// ─── Institution ──────────────────────────────────────────────────────────────
// The full read model for a constitutional institution identity: its UUID,
// its name, its active INS public identifier, and record timestamps.
//
// `id` is the permanent internal constitutional identity and is never used
// as the public-facing identifier.
// `insId` is the immutable public constitutional identifier (INS-XXXXXXXXXXXX).
export interface Institution {
  readonly id: string;
  readonly name: string;
  readonly insId: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
