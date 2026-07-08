import { IdentityError, IdentityErrorCode } from './errors.js';
import type { Identity } from './models.js';
import type { TrkRepository } from './repository.js';

// ─── Identity discovery service interface ────────────────────────────────────
// Looks up a constitutional identity by its active public identifier.
//
// The public identifier (TMP-…, TRK-…, or INS-…) is translated internally to
// the constitutional UUID before any further business logic runs. The UUID
// never leaves the repository or service layer as a result of this lookup.
//
// Only active public identifiers resolve to an identity. An archived TMP
// identifier (superseded after TMP → TRK transition) returns NOT_FOUND —
// callers should use the current TRK identifier.
export interface IdentityDiscoveryService {
  // Retrieves an identity by its active public identifier.
  // Throws IdentityError(NOT_FOUND) if no active identifier matches.
  getByPublicId(publicId: string): Promise<Identity>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createIdentityDiscoveryService(
  repository: TrkRepository,
): IdentityDiscoveryService {
  return {
    async getByPublicId(publicId: string): Promise<Identity> {
      const identity = await repository.findByPublicId(publicId);

      if (identity === undefined) {
        throw new IdentityError(
          'No identity exists with the given public identifier.',
          IdentityErrorCode.NOT_FOUND,
        );
      }

      return identity;
    },
  };
}
