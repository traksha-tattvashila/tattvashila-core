import type { ContactType, Identity } from '../models.js';

// ─── API response models ──────────────────────────────────────────────────────
// Typed shapes returned by the identity HTTP endpoints.
// These are the only response structures the handlers may produce.

export interface VerifiedContactResponse {
  readonly type: ContactType;
  readonly value: string;
}

// GET /identities/:id → 200
// GET /identities?contactType=&contactValue= → 200
export interface IdentityResponse {
  readonly id: string;
  readonly state: string;
  readonly contacts: readonly VerifiedContactResponse[];
  readonly createdAt: string; // ISO 8601
  readonly updatedAt: string; // ISO 8601
}

// ─── Mapping ──────────────────────────────────────────────────────────────────
// Converts the domain model to its wire representation.
// Dates are serialised to ISO 8601 strings — the domain model never leaks
// its Date instances directly to the HTTP layer.
export function toIdentityResponse(identity: Identity): IdentityResponse {
  return {
    id: identity.id,
    state: identity.state,
    contacts: identity.contacts.map((contact) => ({
      type: contact.type,
      value: contact.value,
    })),
    createdAt: identity.createdAt.toISOString(),
    updatedAt: identity.updatedAt.toISOString(),
  };
}
