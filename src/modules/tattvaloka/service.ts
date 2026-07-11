import { TattvalokaError, TattvalokaErrorCode } from './errors.js';
import type { TattvalokaParticipant } from './models.js';
import type { TattvalokaRepository } from './repository.js';

// ─── PostgreSQL error codes ────────────────────────────────────────────────────
const PG_UNIQUE_VIOLATION = '23505';

function pgCode(error: unknown): string | undefined {
  if (!(error instanceof Error)) {
    return undefined;
  }
  // drizzle-orm's node-postgres driver wraps the underlying pg error in
  // `cause` rather than exposing `code` directly on the thrown Error —
  // check both so a unique-violation is recognised regardless of shape.
  if ('code' in error && typeof (error as { code?: unknown }).code === 'string') {
    return (error as { code: string }).code;
  }
  const cause = (error as { cause?: unknown }).cause;
  if (cause instanceof Error && 'code' in cause && typeof (cause as { code?: unknown }).code === 'string') {
    return (cause as { code: string }).code;
  }
  return undefined;
}

function isUniqueViolation(error: unknown): boolean {
  return pgCode(error) === PG_UNIQUE_VIOLATION;
}

// ─── Tattvaloka service interface ─────────────────────────────────────────────
// Manages participation registration for constitutional identities in the
// Tattvaloka (Constitutional Participation Layer) foundation.
//
// Constitutional rules:
// — Never creates or modifies a constitutional identity.
// — Never modifies identity_state.
// — Always operates on an already-authenticated constitutional identity.
// — Exactly one participant record per identity is enforced at both the
//   service and database layer.
export interface TattvalokaService {
  // Registers the given identity as a Tattvaloka participant.
  // Throws TattvalokaError(ALREADY_EXISTS) if a participant record already
  // exists for this identity.
  registerParticipant(identityId: string): Promise<TattvalokaParticipant>;

  // Retrieves the participant record for the given identity.
  // Throws TattvalokaError(NOT_FOUND) if no participant record exists.
  getParticipant(identityId: string): Promise<TattvalokaParticipant>;
}

export function createTattvalokaService(
  repository: TattvalokaRepository,
): TattvalokaService {
  return {
    async registerParticipant(identityId) {
      try {
        return await repository.createParticipant(identityId);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TattvalokaError(
            'A Tattvaloka participant record already exists for this identity.',
            TattvalokaErrorCode.ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    async getParticipant(identityId) {
      const participant = await repository.findByIdentityId(identityId);
      if (participant === undefined) {
        throw new TattvalokaError(
          'No Tattvaloka participant record exists for this identity.',
          TattvalokaErrorCode.NOT_FOUND,
        );
      }
      return participant;
    },
  };
}
