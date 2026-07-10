import { eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { TattvalokaParticipant } from './models.js';
import { tattvalokaParticipants } from './schema.js';

// ─── Tattvaloka repository interface ──────────────────────────────────────────
// Persistence-only. No business rules live here — the Tattvaloka service
// decides what constitutes a valid operation; the repository only executes
// reads and writes against the database.
export interface TattvalokaRepository {
  // Creates a participant record for the given constitutional identity.
  // Callers must ensure no participant record already exists — the unique
  // constraint on identity_id enforces this at the database layer, and the
  // service maps the resulting unique-violation into a domain error.
  createParticipant(identityId: string): Promise<TattvalokaParticipant>;

  // Retrieves a participant record by constitutional identity UUID.
  // Returns undefined if no participant record exists — callers decide how
  // to surface absence (the service maps this to TattvalokaError).
  findByIdentityId(identityId: string): Promise<TattvalokaParticipant | undefined>;
}

export function createTattvalokaRepository(db: DatabaseClient): TattvalokaRepository {
  return {
    async createParticipant(identityId) {
      const rows = await db
        .insert(tattvalokaParticipants)
        .values({ identityId })
        .returning();

      return rows[0] as TattvalokaParticipant;
    },

    async findByIdentityId(identityId) {
      const rows = await db
        .select()
        .from(tattvalokaParticipants)
        .where(eq(tattvalokaParticipants.identityId, identityId))
        .limit(1);

      return rows[0];
    },
  };
}
