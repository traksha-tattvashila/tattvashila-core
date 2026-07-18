import { and, eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type {
  ContentModule,
  ContentPath,
  ContentStatus,
  ContentUnit,
  ContentUnitVersion,
} from './content-models.js';
import {
  tattvapeethaContentModules,
  tattvapeethaContentPaths,
  tattvapeethaContentUnits,
  tattvapeethaContentUnitVersions,
} from './schema.js';

// ─── Tattvapeetha content repository interface ──────────────────────────────────
// Persistence-only. No business rules live here — the content service
// decides what constitutes a valid operation (hierarchy integrity, status
// transitions, versioning discipline); the repository only executes reads
// and writes against the database.
export interface ContentRepository {
  createPath(contentKey: string, title: string): Promise<ContentPath>;
  findPathById(id: string): Promise<ContentPath | undefined>;
  updatePathStatus(id: string, status: ContentStatus): Promise<ContentPath>;

  createModule(pathId: string, contentKey: string, title: string): Promise<ContentModule>;
  findModuleById(id: string): Promise<ContentModule | undefined>;
  updateModuleStatus(id: string, status: ContentStatus): Promise<ContentModule>;

  createUnit(moduleId: string, contentKey: string): Promise<ContentUnit>;
  findUnitById(id: string): Promise<ContentUnit | undefined>;
  updateUnitStatus(id: string, status: ContentStatus): Promise<ContentUnit>;

  // Atomically assigns the next sequential versionNumber, demotes any
  // existing current version, and inserts the new version as current — all
  // within a single transaction, so exactly one version is ever current at
  // a time and versionNumber assignment cannot race.
  addVersion(unitId: string, title: string, body: string): Promise<ContentUnitVersion>;
  findCurrentVersion(unitId: string): Promise<ContentUnitVersion | undefined>;
  findVersionById(id: string): Promise<ContentUnitVersion | undefined>;
  listVersionsByUnitId(unitId: string): Promise<ContentUnitVersion[]>;
}

export function createContentRepository(db: DatabaseClient): ContentRepository {
  return {
    async createPath(contentKey, title) {
      const rows = await db
        .insert(tattvapeethaContentPaths)
        .values({ contentKey, title })
        .returning();
      return rows[0] as ContentPath;
    },

    async findPathById(id) {
      const rows = await db
        .select()
        .from(tattvapeethaContentPaths)
        .where(eq(tattvapeethaContentPaths.id, id))
        .limit(1);
      return rows[0];
    },

    async updatePathStatus(id, status) {
      const rows = await db
        .update(tattvapeethaContentPaths)
        .set({ status })
        .where(eq(tattvapeethaContentPaths.id, id))
        .returning();
      return rows[0] as ContentPath;
    },

    async createModule(pathId, contentKey, title) {
      const rows = await db
        .insert(tattvapeethaContentModules)
        .values({ pathId, contentKey, title })
        .returning();
      return rows[0] as ContentModule;
    },

    async findModuleById(id) {
      const rows = await db
        .select()
        .from(tattvapeethaContentModules)
        .where(eq(tattvapeethaContentModules.id, id))
        .limit(1);
      return rows[0];
    },

    async updateModuleStatus(id, status) {
      const rows = await db
        .update(tattvapeethaContentModules)
        .set({ status })
        .where(eq(tattvapeethaContentModules.id, id))
        .returning();
      return rows[0] as ContentModule;
    },

    async createUnit(moduleId, contentKey) {
      const rows = await db
        .insert(tattvapeethaContentUnits)
        .values({ moduleId, contentKey })
        .returning();
      return rows[0] as ContentUnit;
    },

    async findUnitById(id) {
      const rows = await db
        .select()
        .from(tattvapeethaContentUnits)
        .where(eq(tattvapeethaContentUnits.id, id))
        .limit(1);
      return rows[0];
    },

    async updateUnitStatus(id, status) {
      const rows = await db
        .update(tattvapeethaContentUnits)
        .set({ status })
        .where(eq(tattvapeethaContentUnits.id, id))
        .returning();
      return rows[0] as ContentUnit;
    },

    async addVersion(unitId, title, body) {
      return db.transaction(async (tx) => {
        const existing = await tx
          .select({ versionNumber: tattvapeethaContentUnitVersions.versionNumber })
          .from(tattvapeethaContentUnitVersions)
          .where(eq(tattvapeethaContentUnitVersions.unitId, unitId));

        const nextVersionNumber =
          existing.reduce((max, row) => Math.max(max, row.versionNumber), 0) + 1;

        await tx
          .update(tattvapeethaContentUnitVersions)
          .set({ isCurrent: false })
          .where(
            and(
              eq(tattvapeethaContentUnitVersions.unitId, unitId),
              eq(tattvapeethaContentUnitVersions.isCurrent, true),
            ),
          );

        const rows = await tx
          .insert(tattvapeethaContentUnitVersions)
          .values({ unitId, versionNumber: nextVersionNumber, title, body, isCurrent: true })
          .returning();

        return rows[0] as ContentUnitVersion;
      });
    },

    async findCurrentVersion(unitId) {
      const rows = await db
        .select()
        .from(tattvapeethaContentUnitVersions)
        .where(
          and(
            eq(tattvapeethaContentUnitVersions.unitId, unitId),
            eq(tattvapeethaContentUnitVersions.isCurrent, true),
          ),
        )
        .limit(1);
      return rows[0];
    },

    async findVersionById(id) {
      const rows = await db
        .select()
        .from(tattvapeethaContentUnitVersions)
        .where(eq(tattvapeethaContentUnitVersions.id, id))
        .limit(1);
      return rows[0];
    },

    async listVersionsByUnitId(unitId) {
      return db
        .select()
        .from(tattvapeethaContentUnitVersions)
        .where(eq(tattvapeethaContentUnitVersions.unitId, unitId))
        .orderBy(tattvapeethaContentUnitVersions.versionNumber);
    },
  };
}
