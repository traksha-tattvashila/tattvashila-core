import type { Request } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { DiscoveryService } from '../discovery-service.js';
import { createDiscoveryHandlers } from './discovery-handlers.js';

// ─── Tattvaloka discovery router ────────────────────────────────────────────────
// Mounts (relative to the parent /tattvaloka prefix), all under /discovery:
//   GET /discovery/content?q=...     — search published content by title/key
//   GET /discovery/members/:publicId — check whether a public identifier
//                                       belongs to an active Tattvaloka member
//
// Discovery (Sprint 19) is a strictly read-only, derived layer — it exposes
// only public identifiers (contentKey / TMP-TRK-INS), never raw UUIDs, and
// never per-member progress data. It follows the same unauthenticated
// pattern already used for content architecture (content-routes.ts) since
// this sprint defines no authorization scheme of its own.
export function createDiscoveryRouter(service: DiscoveryService): Router {
  const router = Router();
  const handlers = createDiscoveryHandlers(service);

  router.get('/discovery/content', asyncHandler(handlers.searchContent));
  router.get(
    '/discovery/members/:publicId',
    asyncHandler((req, res) =>
      handlers.discoverMember(req as Request<{ publicId: string }>, res),
    ),
  );

  return router;
}
