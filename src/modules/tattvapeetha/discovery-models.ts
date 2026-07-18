// ─── Tattvapeetha discovery domain models ────────────────────────────────────────
// Read-side domain shapes for the Tattvapeetha discovery & search application
// layer. This layer holds no primary data of its own — every shape here is
// derived, at query time, from content (Sprint 17) records that remain the
// sole source of truth.

// The kind of content hierarchy level a search result belongs to.
export const CONTENT_SEARCH_RESULT_TYPES = ['path', 'module', 'unit'] as const;
export type ContentSearchResultType = (typeof CONTENT_SEARCH_RESULT_TYPES)[number];

// A single discoverable content result. Deliberately excludes every raw
// UUID (path/module/unit id, version id) — contentKey is the only
// identifier ever exposed, consistent with content architecture's own
// distinction between contentKey and UUID.
export interface ContentSearchResult {
  readonly type: ContentSearchResultType;
  readonly contentKey: string;
  readonly title: string;
  readonly position: number;
}

