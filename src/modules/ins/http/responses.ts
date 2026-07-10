import type { Institution } from '../models.js';

// ─── API response models ──────────────────────────────────────────────────────
// Typed shapes returned by the institution HTTP endpoints.
// These are the only response structures the handlers may produce.

// POST /institutions                → 201
// GET  /institutions/public/:insId  → 200
export interface InstitutionResponse {
  readonly id: string;
  readonly name: string;
  readonly insId: string;
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

// ─── Mapping ──────────────────────────────────────────────────────────────────
// Converts the domain model to its wire representation.
// Dates are serialised to ISO 8601 strings — the domain model never leaks
// its Date instances directly to the HTTP layer.
export function toInstitutionResponse(institution: Institution): InstitutionResponse {
  return {
    id: institution.id,
    name: institution.name,
    insId: institution.insId,
    createdAt: institution.createdAt.toISOString(),
    updatedAt: institution.updatedAt.toISOString(),
  };
}
