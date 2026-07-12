// ─── Tattvaloka discovery domain models ─────────────────────────────────────────
// Read-side domain shapes for the Tattvaloka discovery & search application
// layer. This layer holds no primary data of its own — every shape here is
// derived, at query time, from content (Sprint 17) and membership (Sprint 16)
// records that remain the sole source of truth.

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

// The public-facing result of a membership discovery lookup. Reports only
// whether the given public identifier belongs to an active Tattvaloka
// member — never the membership UUID, memberSince date, or any progress
// information, which this sprint is explicitly forbidden from exposing.
export interface MemberDiscoveryResult {
  readonly publicId: string;
  readonly isMember: boolean;
}
