import { eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { TattvapeethaEntity } from './models.js';
import { tattvapeethaEntities } from './schema.js';

// ─── Tattvapeetha repository interface ──────────────────────────────────────────
// Persistence-only. No business rules live here — the Tattvapeetha service
// decides what constitutes a valid operation; the repository only executes
// reads and writes against the database.
export interface TattvapeethaRepository {
  // Creates a Tattvapeetha entity owned by the given institution. Callers
  // must ensure no entity already exists for this institution — the unique
  // constraint on institution_id enforces this at the database layer, and
  // the service maps the resulting unique-violation into a domain error.
  createEntity(institutionId: string): Promise<TattvapeethaEntity>;

  // Retrieves a Tattvapeetha entity by its owning institution's UUID.
  // Returns undefined if no entity exists — callers decide how to surface
  // absence (the service maps this to TattvapeethaError).
  findByInstitutionId(institutionId: string): Promise<TattvapeethaEntity | undefined>;
}

export function createTattvapeethaRepository(db: DatabaseClient): TattvapeethaRepository {
  return {
    async createEntity(institutionId) {
      const rows = await db
        .insert(tattvapeethaEntities)
        .values({ institutionId })
        .returning();

      return rows[0] as TattvapeethaEntity;
    },

    async findByInstitutionId(institutionId) {
      const rows = await db
        .select()
        .from(tattvapeethaEntities)
        .where(eq(tattvapeethaEntities.institutionId, institutionId))
        .limit(1);

      return rows[0];
    },
  };
}
