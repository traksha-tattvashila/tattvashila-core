import { and, eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { ProgressRecord, StoredProgressStatus } from './progress-models.js';
import { tattvalokaProgressRecords } from './schema.js';

// ─── Tattvaloka progress repository interface ───────────────────────────────────
// Persistence-only. No business rules live here — the progress service
// decides what constitutes a valid operation (allowed transitions, content
// trackability); the repository only executes reads and writes against the
// database.
export interface ProgressRepository {
  findByMembershipAndVersion(
    membershipId: string,
    unitVersionId: string,
  ): Promise<ProgressRecord | undefined>;

  // Creates a new progress record. Callers must ensure no record already
  // exists for this (membership, version) pair — the unique constraint
  // enforces this at the database layer.
  create(
    membershipId: string,
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
    async findByMembershipAndVersion(membershipId, unitVersionId) {
      const rows = await db
        .select()
        .from(tattvalokaProgressRecords)
        .where(
          and(
            eq(tattvalokaProgressRecords.membershipId, membershipId),
            eq(tattvalokaProgressRecords.unitVersionId, unitVersionId),
          ),
        )
        .limit(1);
      return rows[0] as ProgressRecord | undefined;
    },

    async create(membershipId, unitVersionId, status) {
      const rows = await db
        .insert(tattvalokaProgressRecords)
        .values({
          membershipId,
          unitVersionId,
          status,
          completedAt: status === 'completed' ? new Date() : undefined,
        })
        .returning();
      return rows[0] as ProgressRecord;
    },

    async updateStatus(id, status, completedAt) {
      const rows = await db
        .update(tattvalokaProgressRecords)
        .set({ status, completedAt })
        .where(eq(tattvalokaProgressRecords.id, id))
        .returning();
      return rows[0] as ProgressRecord;
    },
  };
}
