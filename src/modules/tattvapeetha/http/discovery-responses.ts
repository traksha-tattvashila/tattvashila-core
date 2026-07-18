import type { ContentSearchResult } from '../discovery-models.js';

// ─── Tattvapeetha discovery API response models ──────────────────────────────────

// GET /tattvapeetha/discovery/content → 200
export interface ContentSearchResultResponse {
  readonly type: ContentSearchResult['type'];
  readonly contentKey: string;
  readonly title: string;
  readonly position: number;
}

// ─── Mapping ──────────────────────────────────────────────────────────────────────
// Domain shapes already match the wire representation exactly (no Date
// fields, no UUIDs) — these mappers exist so the HTTP layer never depends
// on domain model shapes directly, matching every other module.
export function toContentSearchResultResponse(
  result: ContentSearchResult,
): ContentSearchResultResponse {
  return {
    type: result.type,
    contentKey: result.contentKey,
    title: result.title,
    position: result.position,
  };
}
