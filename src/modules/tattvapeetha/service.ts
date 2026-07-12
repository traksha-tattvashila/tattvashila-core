import { TattvapeethaError, TattvapeethaErrorCode } from './errors.js';
import type { TattvapeethaEntity } from './models.js';
import type { TattvapeethaRepository } from './repository.js';

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

// ─── Tattvapeetha service interface ─────────────────────────────────────────────
// Establishes the constitutional entity model for Tattvapeetha, anchored to
// the frozen Institution Identity Foundation.
//
// Constitutional rules:
// — Never creates or modifies an institution (INS) or its identity state.
// — A Tattvapeetha entity resolves to exactly one owning institution.
// — Exactly one Tattvapeetha entity per institution is enforced at both the
//   service and database layer.
export interface TattvapeethaService {
  // Registers a new Tattvapeetha entity owned by the given institution.
  // Throws TattvapeethaError(ALREADY_EXISTS) if an entity already exists
  // for this institution.
  registerEntity(institutionId: string): Promise<TattvapeethaEntity>;

  // Retrieves the Tattvapeetha entity owned by the given institution.
  // Throws TattvapeethaError(NOT_FOUND) if no entity exists.
  getEntity(institutionId: string): Promise<TattvapeethaEntity>;
}

export function createTattvapeethaService(
  repository: TattvapeethaRepository,
): TattvapeethaService {
  return {
    async registerEntity(institutionId) {
      try {
        return await repository.createEntity(institutionId);
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new TattvapeethaError(
            'A Tattvapeetha entity already exists for this institution.',
            TattvapeethaErrorCode.ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    async getEntity(institutionId) {
      const entity = await repository.findByInstitutionId(institutionId);
      if (entity === undefined) {
        throw new TattvapeethaError(
          'No Tattvapeetha entity exists for this institution.',
          TattvapeethaErrorCode.NOT_FOUND,
        );
      }
      return entity;
    },
  };
}
