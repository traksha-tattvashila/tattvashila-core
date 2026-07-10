import { eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { TattvalokaMembership } from './membership-models.js';
import { tattvalokaMemberships } from './schema.js';

// ─── Tattvaloka membership repository interface ───────────────────────────────
// Persistence-only. No business rules live here — the membership service
// decides what constitutes a valid operation; the repository only executes
// reads and writes against the database.
export interface MembershipRepository {
  // Creates a membership record for the given constitutional identity.
  // Callers must ensure no membership record already exists — the unique
  // constraint on identity_id enforces this at the database layer, and the
  // service maps the resulting unique-violation into a domain error.
  createMembership(identityId: string): Promise<TattvalokaMembership>;

  // Retrieves a membership record by constitutional identity UUID.
  // Returns undefined if no membership record exists — callers decide how
  // to surface absence (the service maps this to MembershipError).
  findByIdentityId(identityId: string): Promise<TattvalokaMembership | undefined>;
}

export function createMembershipRepository(db: DatabaseClient): MembershipRepository {
  return {
    async createMembership(identityId) {
      const rows = await db
        .insert(tattvalokaMemberships)
        .values({ identityId })
        .returning();

      return rows[0] as TattvalokaMembership;
    },

    async findByIdentityId(identityId) {
      const rows = await db
        .select()
        .from(tattvalokaMemberships)
        .where(eq(tattvalokaMemberships.identityId, identityId))
        .limit(1);

      return rows[0];
    },
  };
}
