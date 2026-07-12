import { and, eq, ilike, or } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import {
  tattvalokaContentModules,
  tattvalokaContentPaths,
  tattvalokaContentUnits,
  tattvalokaContentUnitVersions,
} from './schema.js';

// ─── Discoverable content row ───────────────────────────────────────────────────
// Persistence-shaped row shared by all three hierarchy levels — the service
// layer, not the repository, decides how these are labelled and filtered.
export interface DiscoverableContentRow {
  readonly contentKey: string;
  readonly title: string;
  readonly position: number;
}

// ─── Tattvaloka discovery repository interface ──────────────────────────────────
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
          contentKey: tattvalokaContentPaths.contentKey,
          title: tattvalokaContentPaths.title,
          position: tattvalokaContentPaths.position,
        })
        .from(tattvalokaContentPaths)
        .where(
          and(
            eq(tattvalokaContentPaths.status, 'published'),
            or(
              ilike(tattvalokaContentPaths.title, pattern),
              ilike(tattvalokaContentPaths.contentKey, pattern),
            ),
          ),
        );
    },

    async searchPublishedModules(query) {
      const pattern = `%${query}%`;
      return db
        .select({
          contentKey: tattvalokaContentModules.contentKey,
          title: tattvalokaContentModules.title,
          position: tattvalokaContentModules.position,
        })
        .from(tattvalokaContentModules)
        .where(
          and(
            eq(tattvalokaContentModules.status, 'published'),
            or(
              ilike(tattvalokaContentModules.title, pattern),
              ilike(tattvalokaContentModules.contentKey, pattern),
            ),
          ),
        );
    },

    async searchPublishedUnits(query) {
      const pattern = `%${query}%`;
      return db
        .select({
          contentKey: tattvalokaContentUnits.contentKey,
          title: tattvalokaContentUnitVersions.title,
          position: tattvalokaContentUnits.position,
        })
        .from(tattvalokaContentUnits)
        .innerJoin(
          tattvalokaContentUnitVersions,
          and(
            eq(tattvalokaContentUnitVersions.unitId, tattvalokaContentUnits.id),
            eq(tattvalokaContentUnitVersions.isCurrent, true),
          ),
        )
        .where(
          and(
            eq(tattvalokaContentUnits.status, 'published'),
            or(
              ilike(tattvalokaContentUnitVersions.title, pattern),
              ilike(tattvalokaContentUnits.contentKey, pattern),
            ),
          ),
        );
    },
  };
}
