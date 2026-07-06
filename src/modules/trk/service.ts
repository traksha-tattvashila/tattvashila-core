import { IdentityError, IdentityErrorCode } from './errors.js';
import type { ContactType, Identity } from './models.js';
import type { TrkRepository } from './repository.js';

// ─── Identity service interface ──────────────────────────────────────────────
// The application-layer contract for identity retrieval. Wraps the TRK
// repository with the business rule that an absent record is a domain
// error, not a nullable value — callers never need to null-check.
export interface IdentityService {
  // Retrieves an identity by its constitutional UUID.
  // Throws IdentityError(NOT_FOUND) if no identity exists with that id.
  getById(id: string): Promise<Identity>;

  // Retrieves an identity by one of its verified contacts.
  // Throws IdentityError(NOT_FOUND) if no identity has a verified contact
  // matching the given type and value.
  getByVerifiedContact(type: ContactType, value: string): Promise<Identity>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createIdentityService(repository: TrkRepository): IdentityService {
  return {
    async getById(id: string): Promise<Identity> {
      const identity = await repository.findById(id);

      if (identity === undefined) {
        throw new IdentityError(
          'No identity exists with the given id.',
          IdentityErrorCode.NOT_FOUND,
        );
      }

      return identity;
    },

    async getByVerifiedContact(type: ContactType, value: string): Promise<Identity> {
      const identity = await repository.findByVerifiedContact(type, value);

      if (identity === undefined) {
        throw new IdentityError(
          'No identity is linked to the given verified contact.',
          IdentityErrorCode.NOT_FOUND,
        );
      }

      return identity;
    },
  };
}
