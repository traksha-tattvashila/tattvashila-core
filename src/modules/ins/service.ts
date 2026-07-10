import { InstitutionError, InstitutionErrorCode } from './errors.js';
import type { Institution } from './models.js';
import type { InstitutionRepository } from './repository.js';

// ─── Institution service interface ────────────────────────────────────────────
// The application-layer contract for institution identity management.
// Wraps repository calls with domain business rules — absent records are
// domain errors, not nullable values; callers never need to null-check.
//
// Constitutional rules enforced here:
// — One registration = one constitutional UUID + one immutable INS identifier.
// — INS identifier is issued by the repository at creation; the service
//   never touches identifier generation directly.
// — Business logic operates on UUID internally; INS is only the lookup key.
export interface InstitutionService {
  // Creates a new constitutional institution identity and issues its INS
  // public identifier. Returns the full institution read model.
  registerInstitution(name: string): Promise<Institution>;

  // Retrieves an institution by its INS public identifier.
  // Throws InstitutionError(NOT_FOUND) if no institution exists with that INS id.
  // INS is the only constitutional external lookup key for institutions.
  getByInsId(insId: string): Promise<Institution>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createInstitutionService(
  repository: InstitutionRepository,
): InstitutionService {
  return {
    async registerInstitution(name) {
      return repository.createInstitution(name);
    },

    async getByInsId(insId) {
      const institution = await repository.findByInsId(insId);

      if (institution === undefined) {
        throw new InstitutionError(
          'No institution exists with the given public identifier.',
          InstitutionErrorCode.NOT_FOUND,
        );
      }

      return institution;
    },
  };
}
