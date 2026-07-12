import type { IdentityDiscoveryService } from '../trk/discovery-service.js';
import type { DiscoveryRepository } from './discovery-repository.js';
import type { ContentSearchResult, MemberDiscoveryResult } from './discovery-models.js';
import { isMembershipError } from './membership-errors.js';
import type { MembershipService } from './membership-service.js';

// ─── Tattvaloka discovery service interface ─────────────────────────────────────
// Strictly derived, read-only layer over content (Sprint 17) and membership
// (Sprint 16) data — it is never a system of record.
//
// Constitutional rules:
// — Discovery never exposes UUIDs; only contentKey (content) and public
//   identifiers (TMP/TRK/INS, for membership lookups) ever surface.
// — Only published content is discoverable; draft and retired content never
//   appear in search results.
// — No per-member progress data is exposed by this layer at all — search
//   never reports how far a member has advanced through anything.
// — This layer performs no writes and holds no primary data of its own.
export interface DiscoveryService {
  // Searches published content (paths, modules, units) by title or
  // contentKey, case-insensitive substring match. Returns an empty array
  // for no matches — an empty result set is not an error condition.
  searchContent(query: string): Promise<ContentSearchResult[]>;

  // Reports whether the given active public identifier belongs to a
  // current Tattvaloka member. Resolves the public identifier through the
  // existing identity discovery service (Sprint 13) — never accepts or
  // exposes a raw UUID.
  // Throws IdentityError(NOT_FOUND) if the public identifier does not
  // resolve to an active identity.
  discoverMember(publicId: string): Promise<MemberDiscoveryResult>;
}

export function createDiscoveryService(
  repository: DiscoveryRepository,
  identityDiscoveryService: IdentityDiscoveryService,
  membershipService: MembershipService,
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

    async discoverMember(publicId) {
      // Propagates IdentityError(NOT_FOUND) unchanged if the public
      // identifier does not resolve — discovery never invents an identity.
      const identity = await identityDiscoveryService.getByPublicId(publicId);

      try {
        await membershipService.getMembership(identity.id);
        return { publicId: identity.publicId, isMember: true };
      } catch (error) {
        if (isMembershipError(error)) {
          return { publicId: identity.publicId, isMember: false };
        }
        throw error;
      }
    },
  };
}
