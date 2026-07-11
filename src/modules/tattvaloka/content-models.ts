// ─── Tattvaloka content domain models ───────────────────────────────────────────
// Read-side domain shapes for the Tattvaloka content architecture application
// layer. Content is a fixed three-level hierarchy — Path → Module → Unit —
// with substance living exclusively in immutable unit versions.

// Closed constitutional content lifecycle enumeration.
export const CONTENT_STATUSES = ['draft', 'published', 'retired'] as const;
export type ContentStatus = (typeof CONTENT_STATUSES)[number];

// The full read model for a content path (hierarchy level 1).
export interface ContentPath {
  readonly id: string;
  readonly contentKey: string;
  readonly title: string;
  readonly status: ContentStatus;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// The full read model for a content module (hierarchy level 2).
export interface ContentModule {
  readonly id: string;
  readonly pathId: string;
  readonly contentKey: string;
  readonly title: string;
  readonly status: ContentStatus;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// The full read model for a content unit (hierarchy level 3 — leaf).
// A unit is the persistent, immutable anchor future progress records will
// reference; it holds no substance of its own (see ContentUnitVersion).
export interface ContentUnit {
  readonly id: string;
  readonly moduleId: string;
  readonly contentKey: string;
  readonly status: ContentStatus;
  readonly position: number;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// The full read model for a content unit version — the substantive,
// immutable content payload. title/body are fixed permanently at creation;
// isCurrent is the only field ever updated on an existing version row.
export interface ContentUnitVersion {
  readonly id: string;
  readonly unitId: string;
  readonly versionNumber: number;
  readonly title: string;
  readonly body: string;
  readonly isCurrent: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
