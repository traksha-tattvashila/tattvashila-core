import type { DiscoveryRepository } from './discovery-repository.js';
import type { ContentSearchResult } from './discovery-models.js';

// ─── Tattvapeetha discovery service interface ───────────────────────────────────
// Strictly derived, read-only layer over content (Sprint 17) data —
// it is never a system of record.
//
// Constitutional rules:
// — Discovery never exposes UUIDs; only contentKey (content) and public
//   identifiers (TMP/TRK/INS) ever surface.
// — Only published content is discoverable; draft and retired content never
//   appear in search results.
// — No per-identity progress data is exposed by this layer at all — search
//   never reports how far an identity has advanced through anything.
// — This layer performs no writes and holds no primary data of its own.
export interface DiscoveryService {
  // Searches published content (paths, modules, units) by title or
  // contentKey, case-insensitive substring match. Returns an empty array
  // for no matches — an empty result set is not an error condition.
  searchContent(query: string): Promise<ContentSearchResult[]>;
}

export function createDiscoveryService(
  repository: DiscoveryRepository,
): DiscoveryService {
  return {
    async searchContent(query) {
      const [paths, modules, units] = await Promise.all([
        repository.searchPublishedPaths(query),
        repository.searchPublishedModules(query),
        repository.searchPublishedUnits(query),
      ]);

      const results: ContentSearchResult[] = [
        ...paths.map((row) => ({ type: 'path' as const, ...row })),
        ...modules.map((row) => ({ type: 'module' as const, ...row })),
        ...units.map((row) => ({ type: 'unit' as const, ...row })),
      ];

      return results;
    },
  };
}
