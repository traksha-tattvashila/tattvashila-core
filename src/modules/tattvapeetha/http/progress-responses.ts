import type { AggregateProgress, UnitProgress } from '../progress-models.js';

// ─── Tattvapeetha progress API response models ──────────────────────────────────

// POST /tattvapeetha/progress/units/:unitId/start    → 200
// POST /tattvapeetha/progress/units/:unitId/complete → 200
// GET  /tattvapeetha/progress/units/:unitId          → 200
export interface UnitProgressResponse {
  readonly unitId: string;
  readonly status: UnitProgress['status'];
  readonly startedAt: string | null; // ISO 8601
  readonly completedAt: string | null; // ISO 8601
}

// POST /tattvapeetha/progress/aggregate → 200
export interface AggregateProgressResponse {
  readonly total: number;
  readonly notStarted: number;
  readonly inProgress: number;
  readonly completed: number;
  readonly percentComplete: number;
  readonly units: readonly UnitProgressResponse[];
}

// ─── Mapping ───────────────────────────────────────────────────────────────────
// Converts domain models to their wire representation. Dates are serialised
// to ISO 8601 strings (or null when absent) — the domain model never leaks
// Date instances directly to the HTTP layer.
export function toUnitProgressResponse(progress: UnitProgress): UnitProgressResponse {
  return {
    unitId: progress.unitId,
    status: progress.status,
    startedAt: progress.startedAt?.toISOString() ?? null,
    completedAt: progress.completedAt?.toISOString() ?? null,
  };
}

export function toAggregateProgressResponse(
  aggregate: AggregateProgress,
): AggregateProgressResponse {
  return {
    total: aggregate.total,
    notStarted: aggregate.notStarted,
    inProgress: aggregate.inProgress,
    completed: aggregate.completed,
    percentComplete: aggregate.percentComplete,
    units: aggregate.units.map(toUnitProgressResponse),
  };
}
