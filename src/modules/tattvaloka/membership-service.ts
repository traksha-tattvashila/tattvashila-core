import { MembershipError, MembershipErrorCode } from './membership-errors.js';
import type { TattvalokaMembership } from './membership-models.js';
import type { MembershipRepository } from './membership-repository.js';
import type { TattvalokaService } from './service.js';

// ─── PostgreSQL error codes ────────────────────────────────────────────────────
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

// ─── Tattvaloka membership service interface ──────────────────────────────────
// Manages membership registration for constitutional identities that are
// already Tattvaloka participants (Sprint 15 foundation).
//
// Constitutional rules:
// — Never creates or modifies a constitutional identity.
// — Never modifies identity_state or TMP/TRK.
// — Membership is separate from constitutional identity, profile,
//   authentication, and authorization — it depends only on Tattvaloka
//   participation already existing for the identity.
// — Exactly one membership record per identity is enforced at both the
//   service and database layer.
export interface MembershipService {
  // Registers the given identity as a Tattvaloka member.
  // Throws TattvalokaError(NOT_FOUND) (from the participation service) if
  // the identity is not already a Tattvaloka participant.
  // Throws MembershipError(ALREADY_EXISTS) if a membership record already
  // exists for this identity.
  registerMembership(identityId: string): Promise<TattvalokaMembership>;

  // Retrieves the membership record for the given identity.
  // Throws MembershipError(NOT_FOUND) if no membership record exists.
  getMembership(identityId: string): Promise<TattvalokaMembership>;
}

export function createMembershipService(
  repository: MembershipRepository,
  tattvalokaService: TattvalokaService,
): MembershipService {
  return {
    async registerMembership(identityId) {
      // Membership presupposes participation — this call throws
      // TattvalokaError(NOT_FOUND) if the identity has not yet joined the
      // Tattvaloka participation layer, which propagates unchanged.
      await tattvalokaService.getParticipant(identityId);

      try {
        return await repository.createMembership(identityId);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new MembershipError(
            'A Tattvaloka membership record already exists for this identity.',
            MembershipErrorCode.ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    async getMembership(identityId) {
      const membership = await repository.findByIdentityId(identityId);
      if (membership === undefined) {
        throw new MembershipError(
          'No Tattvaloka membership record exists for this identity.',
          MembershipErrorCode.NOT_FOUND,
        );
      }
      return membership;
    },
  };
}
