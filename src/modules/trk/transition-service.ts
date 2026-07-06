import { IdentityError, IdentityErrorCode } from './errors.js';
import type { Identity } from './models.js';
import type { TrkRepository } from './repository.js';

// ─── TRK transition service interface ────────────────────────────────────────
// The application-layer contract for upgrading a constitutional identity
// from TMP to TRK. Wraps the repository's atomic conditional update with
// the business rule that any outcome other than a fresh transition is a
// domain error — callers never inspect a result union.
export interface TrkTransitionService {
  // Transitions the identity with the given UUID from TMP to TRK.
  //
  // Throws IdentityError(NOT_FOUND) if no identity exists with that id.
  // Throws IdentityError(ALREADY_TRK) if the identity has already
  // transitioned — the database is left untouched in that case.
  // The identity's UUID never changes and no new identity is created;
  // this only ever updates the existing record's constitutional state.
  transitionToTrk(id: string): Promise<Identity>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createTrkTransitionService(
  repository: TrkRepository,
): TrkTransitionService {
  return {
    async transitionToTrk(id: string): Promise<Identity> {
      const outcome = await repository.transitionToTrk(id);

      switch (outcome.kind) {
        case 'NOT_FOUND':
          throw new IdentityError(
            'No identity exists with the given id.',
            IdentityErrorCode.NOT_FOUND,
          );

        case 'ALREADY_TRK':
          throw new IdentityError(
            'Identity has already transitioned to TRK.',
            IdentityErrorCode.ALREADY_TRK,
          );

        case 'TRANSITIONED':
          return outcome.identity;
      }
    },
  };
}
