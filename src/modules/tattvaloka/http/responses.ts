import type { TattvalokaParticipant } from '../models.js';

// ─── Tattvaloka API response model ────────────────────────────────────────────
// Typed shape returned by the Tattvaloka HTTP endpoints.

// POST /tattvaloka   → 201
// GET  /tattvaloka/me → 200
export interface TattvalokaParticipantResponse {
  readonly id: string;
  readonly identityId: string;
  readonly joinedAt: string; // ISO 8601
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

// ─── Mapping ───────────────────────────────────────────────────────────────────
// Converts the domain model to its wire representation.
// Dates are serialised to ISO 8601 — the domain model never leaks Date
// instances directly to the HTTP layer.
export function toTattvalokaParticipantResponse(
  participant: TattvalokaParticipant,
): TattvalokaParticipantResponse {
  return {
    id: participant.id,
    identityId: participant.identityId,
    joinedAt: participant.joinedAt.toISOString(),
    createdAt: participant.createdAt.toISOString(),
    updatedAt: participant.updatedAt.toISOString(),
  };
}
