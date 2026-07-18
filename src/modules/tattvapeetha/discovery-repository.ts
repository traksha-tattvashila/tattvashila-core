import { and, eq, ilike, or } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import {
  tattvapeethaContentModules,
  tattvapeethaContentPaths,
  tattvapeethaContentUnits,
  tattvapeethaContentUnitVersions,
} from './schema.js';

// ─── Discoverable content row ───────────────────────────────────────────────────
// Persistence-shaped row shared by all three hierarchy levels — the service
// layer, not the repository, decides how these are labelled and filtered.
export interface DiscoverableContentRow {
  readonly contentKey: string;
  readonly title: string;
  readonly position: number;
}

// ─── Tattvapeetha discovery repository interface ────────────────────────────────
// Persistence-only. Holds no primary data — every method here is a read
// query against the existing content tables (Sprint 17), scoped to
// `status = 'published'` so drafts and retired content never surface in
// search results. No business rules live here.
export interface DiscoveryRepository {
  searchPublishedPaths(query: string): Promise<DiscoverableContentRow[]>;
  searchPublishedModules(query: string): Promise<DiscoverableContentRow[]>;
  // Units hold no title of their own — substance lives in their current
  // version (Sprint 17), so this joins each published unit to its current
  // version to surface a searchable title.
  searchPublishedUnits(query: string): Promise<DiscoverableContentRow[]>;
}

export function createDiscoveryRepository(db: DatabaseClient): DiscoveryRepository {
  return {
    async searchPublishedPaths(query) {
      const pattern = `%${query}%`;
      return db
        .select({
          contentKey: tattvapeethaContentPaths.contentKey,
          title: tattvapeethaContentPaths.title,
          position: tattvapeethaContentPaths.position,
        })
        .from(tattvapeethaContentPaths)
        .where(
          and(
            eq(tattvapeethaContentPaths.status, 'published'),
            or(
              ilike(tattvapeethaContentPaths.title, pattern),
              ilike(tattvapeethaContentPaths.contentKey, pattern),
            ),
          ),
        );
    },

    async searchPublishedModules(query) {
      const pattern = `%${query}%`;
      return db
        .select({
          contentKey: tattvapeethaContentModules.contentKey,
          title: tattvapeethaContentModules.title,
          position: tattvapeethaContentModules.position,
        })
        .from(tattvapeethaContentModules)
        .where(
          and(
            eq(tattvapeethaContentModules.status, 'published'),
            or(
              ilike(tattvapeethaContentModules.title, pattern),
              ilike(tattvapeethaContentModules.contentKey, pattern),
            ),
          ),
        );
    },

    async searchPublishedUnits(query) {
      const pattern = `%${query}%`;
      return db
        .select({
          contentKey: tattvapeethaContentUnits.contentKey,
          title: tattvapeethaContentUnitVersions.title,
          position: tattvapeethaContentUnits.position,
        })
        .from(tattvapeethaContentUnits)
        .innerJoin(
          tattvapeethaContentUnitVersions,
          and(
            eq(tattvapeethaContentUnitVersions.unitId, tattvapeethaContentUnits.id),
            eq(tattvapeethaContentUnitVersions.isCurrent, true),
          ),
        )
        .where(
          and(
            eq(tattvapeethaContentUnits.status, 'published'),
            or(
              ilike(tattvapeethaContentUnitVersions.title, pattern),
              ilike(tattvapeethaContentUnits.contentKey, pattern),
            ),
          ),
        );
    },
  };
}
