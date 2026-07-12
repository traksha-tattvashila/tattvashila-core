// ─── Tattvaloka progress domain models ──────────────────────────────────────────
// Read-side domain shapes for the Tattvaloka progress & completion tracking
// application layer. A progress record anchors to a membership record
// (Sprint 16) and an immutable content unit version (Sprint 17) — never to a
// raw identity and never to a mutable content unit.

// Closed constitutional completion enumeration. "not-started" is a computed
// state (absence of a record), never persisted.
export const PROGRESS_STATUSES = ['not_started', 'in_progress', 'completed'] as const;
export type ProgressStatus = (typeof PROGRESS_STATUSES)[number];

// The persisted subset of ProgressStatus — "not_started" is never stored.
export type StoredProgressStatus = Exclude<ProgressStatus, 'not_started'>;

// The full read model for a progress record.
export interface ProgressRecord {
  readonly id: string;
  readonly membershipId: string;
  readonly unitVersionId: string;
  readonly status: StoredProgressStatus;
  readonly startedAt: Date;
  readonly completedAt: Date | undefined;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// The computed progress for a single content unit — reflects the record
// against the unit's *current* version, or "not_started" if none exists.
export interface UnitProgress {
  readonly unitId: string;
  readonly status: ProgressStatus;
  readonly startedAt: Date | undefined;
  readonly completedAt: Date | undefined;
}

// The computed, never-cached rollup across a caller-supplied set of units.
export interface AggregateProgress {
  readonly total: number;
  readonly notStarted: number;
  readonly inProgress: number;
  readonly completed: number;
  readonly percentComplete: number;
  readonly units: readonly UnitProgress[];
}
