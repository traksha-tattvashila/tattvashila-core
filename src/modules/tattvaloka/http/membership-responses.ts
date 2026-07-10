import type { TattvalokaMembership } from '../membership-models.js';

// ─── Tattvaloka membership API response model ─────────────────────────────────
// Typed shape returned by the Tattvaloka membership HTTP endpoints.

// POST /tattvaloka/membership    → 201
// GET  /tattvaloka/membership/me → 200
export interface MembershipResponse {
  readonly id: string;
  readonly identityId: string;
  readonly memberSince: string; // ISO 8601
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

// ─── Mapping ───────────────────────────────────────────────────────────────────
// Converts the domain model to its wire representation.
// Dates are serialised to ISO 8601 — the domain model never leaks Date
// instances directly to the HTTP layer.
export function toMembershipResponse(membership: TattvalokaMembership): MembershipResponse {
  return {
    id: membership.id,
    identityId: membership.identityId,
    memberSince: membership.memberSince.toISOString(),
    createdAt: membership.createdAt.toISOString(),
    updatedAt: membership.updatedAt.toISOString(),
  };
}
