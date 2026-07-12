import type { TattvapeethaEntity } from '../models.js';

// ─── Tattvapeetha API response model ────────────────────────────────────────────
// Typed shape returned by the Tattvapeetha HTTP endpoints.

// POST /tattvapeetha                       → 201
// GET  /tattvapeetha/institutions/:institutionId → 200
export interface TattvapeethaEntityResponse {
  readonly id: string;
  readonly institutionId: string;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

// ─── Mapping ───────────────────────────────────────────────────────────────────
// Converts the domain model to its wire representation.
// Dates are serialised to ISO 8601 — the domain model never leaks Date
// instances directly to the HTTP layer.
export function toTattvapeethaEntityResponse(
  entity: TattvapeethaEntity,
): TattvapeethaEntityResponse {
  return {
    id: entity.id,
    institutionId: entity.institutionId,
    createdAt: entity.createdAt.toISOString(),
    updatedAt: entity.updatedAt.toISOString(),
  };
}
