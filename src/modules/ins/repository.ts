import { eq } from 'drizzle-orm';

import { AppError } from '../../infrastructure/errors/app-error.js';
import type { DatabaseClient } from '../../infrastructure/database/client.js';
import { generateInsId } from '../trk/public-id/generator.js';
import type { Institution } from './models.js';
import { institutions } from './schema.js';

// ─── Institution repository interface ─────────────────────────────────────────
export interface InstitutionRepository {
  // Creates a constitutional institution identity and issues its INS public
  // identifier. Returns the full institution read model.
  //
  // Throws AppError('INS_ID_GENERATION_FAILED', 500) if all retry attempts
  // are exhausted on INS identifier collision — constitutionally impossible
  // in practice (collision probability ≈ 4.7 × 10^−19 per attempt).
  createInstitution(name: string): Promise<Institution>;

  // Retrieves an institution by its constitutional UUID.
  // Returns undefined if no institution exists with that id.
  findById(id: string): Promise<Institution | undefined>;

  // Retrieves an institution by its INS public identifier.
  // Returns undefined if no institution exists with that INS id.
  findByInsId(insId: string): Promise<Institution | undefined>;
}

// ─── PostgreSQL error codes ───────────────────────────────────────────────────
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

// ─── Row mapper ───────────────────────────────────────────────────────────────
function rowToInstitution(row: typeof institutions.$inferSelect): Institution {
  return {
    id: row.id,
    name: row.name,
    insId: row.insId,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

// ─── INS collision-resistant insertion ───────────────────────────────────────
// Institution registration is a single INSERT with no outer transaction.
// A unique violation on ins_id does not abort any transaction — the
// statement fails and the loop retries with a freshly-generated identifier.
//
// The institutions table has exactly one unique constraint (on ins_id), so
// any unique violation from this INSERT is an ins_id collision. A simple
// isUniqueViolation check is sufficient — no constraint-name inspection needed.
//
// Collision probability: 1 / 36^12 (≈ 4.7 × 10^−19) per attempt.
const MAX_INS_RETRIES = 5;

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createInstitutionRepository(db: DatabaseClient): InstitutionRepository {
  return {
    async createInstitution(name) {
      for (let attempt = 1; attempt <= MAX_INS_RETRIES; attempt++) {
        const insId = generateInsId();
        try {
          const rows = await db
            .insert(institutions)
            .values({ name, insId })
            .returning();
          return rowToInstitution(rows[0]!);
        } catch (error) {
          if (isUniqueViolation(error) && attempt < MAX_INS_RETRIES) {
            continue;
          }
          throw isUniqueViolation(error)
            ? new AppError(
                'Failed to generate a unique INS identifier after maximum retries.',
                'INS_ID_GENERATION_FAILED',
                500,
              )
            : error;
        }
      }
      // TypeScript cannot prove the loop always returns or throws — unreachable.
      throw new AppError(
        'Failed to generate a unique INS identifier after maximum retries.',
        'INS_ID_GENERATION_FAILED',
        500,
      );
    },

    async findById(id) {
      const rows = await db
        .select()
        .from(institutions)
        .where(eq(institutions.id, id))
        .limit(1);
      const row = rows[0];
      return row ? rowToInstitution(row) : undefined;
    },

    async findByInsId(insId) {
      const rows = await db
        .select()
        .from(institutions)
        .where(eq(institutions.insId, insId))
        .limit(1);
      const row = rows[0];
      return row ? rowToInstitution(row) : undefined;
    },
  };
}
