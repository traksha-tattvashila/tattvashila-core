import { and, eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { ProgressRecord, StoredProgressStatus } from './progress-models.js';
import { tattvapeethaProgressRecords } from './schema.js';

// ─── Tattvapeetha progress repository interface ─────────────────────────────────
// Persistence-only. No business rules live here — the progress service
// decides what constitutes a valid operation (allowed transitions, content
// trackability); the repository only executes reads and writes against the
// database.
export interface ProgressRepository {
  findByIdentityAndVersion(
    identityId: string,
    unitVersionId: string,
  ): Promise<ProgressRecord | undefined>;

  // Creates a new progress record. Callers must ensure no record already
  // exists for this (identity, version) pair — the unique constraint
  // enforces this at the database layer.
  create(
    identityId: string,
    unitVersionId: string,
    status: StoredProgressStatus,
  ): Promise<ProgressRecord>;

  // Updates the status (and completedAt, when transitioning to completed)
  // of an existing progress record.
  updateStatus(
    id: string,
    status: StoredProgressStatus,
    completedAt: Date | undefined,
  ): Promise<ProgressRecord>;
}

export function createProgressRepository(db: DatabaseClient): ProgressRepository {
  return {
    async findByIdentityAndVersion(identityId, unitVersionId) {
      const rows = await db
        .select()
        .from(tattvapeethaProgressRecords)
        .where(
          and(
            eq(tattvapeethaProgressRecords.identityId, identityId),
            eq(tattvapeethaProgressRecords.unitVersionId, unitVersionId),
          ),
        )
        .limit(1);
      return rows[0] as ProgressRecord | undefined;
    },

    async create(identityId, unitVersionId, status) {
      const rows = await db
        .insert(tattvapeethaProgressRecords)
        .values({
          identityId,
          unitVersionId,
          status,
          completedAt: status === 'completed' ? new Date() : undefined,
        })
        .returning();
      return rows[0] as ProgressRecord;
    },

    async updateStatus(id, status, completedAt) {
      const rows = await db
        .update(tattvapeethaProgressRecords)
        .set({ status, completedAt })
        .where(eq(tattvapeethaProgressRecords.id, id))
        .returning();
      return rows[0] as ProgressRecord;
    },
  };
}
