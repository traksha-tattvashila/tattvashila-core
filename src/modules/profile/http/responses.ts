import type { Profile } from '../models.js';

// ─── Profile API response model ───────────────────────────────────────────────
// Typed shape returned by the profile HTTP endpoints.

// POST /profile → 201
// GET /profile/me → 200
// PATCH /profile/me → 200
export interface ProfileResponse {
  readonly id: string;
  readonly identityId: string;
  readonly displayName: string | null;
  readonly bio: string | null;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

// ─── Mapping ──────────────────────────────────────────────────────────────────
// Converts the domain model to its wire representation.
// Dates are serialised to ISO 8601 — the domain model never leaks Date
// instances directly to the HTTP layer.
export function toProfileResponse(profile: Profile): ProfileResponse {
  return {
    id: profile.id,
    identityId: profile.identityId,
    displayName: profile.displayName,
    bio: profile.bio,
    createdAt: profile.createdAt.toISOString(),
    updatedAt: profile.updatedAt.toISOString(),
  };
}
