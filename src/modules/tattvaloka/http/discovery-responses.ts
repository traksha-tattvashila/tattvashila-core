import type { ContentSearchResult, MemberDiscoveryResult } from '../discovery-models.js';

// ─── Tattvaloka discovery API response models ───────────────────────────────────

// GET /tattvaloka/discovery/content → 200
export interface ContentSearchResultResponse {
  readonly type: ContentSearchResult['type'];
  readonly contentKey: string;
  readonly title: string;
  readonly position: number;
}

// GET /tattvaloka/discovery/members/:publicId → 200
export interface MemberDiscoveryResponse {
  readonly publicId: string;
  readonly isMember: boolean;
}

// ─── Mapping ─────────────────────────────────────────────────────────────────────
// Domain shapes already match the wire representation exactly (no Date
// fields, no UUIDs) — these mappers exist so the HTTP layer never depends
// on domain model shapes directly, matching every other Tattvaloka module.
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

export function toMemberDiscoveryResponse(
  result: MemberDiscoveryResult,
): MemberDiscoveryResponse {
  return {
    publicId: result.publicId,
    isMember: result.isMember,
  };
}
