import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { DiscoveryService } from '../discovery-service.js';
import { createDiscoveryHandlers } from './discovery-handlers.js';

// ─── Tattvapeetha discovery router ──────────────────────────────────────────────
// Mounts (relative to the parent /tattvapeetha prefix), all under /discovery:
//   GET /discovery/content?q=...  — search published content by title/key
//
// Discovery is a strictly read-only, derived layer — it exposes only public
// identifiers (contentKey), never raw UUIDs, and never per-identity progress
// data. It follows the same unauthenticated pattern already used for content
// architecture (content-routes.ts) since this sprint defines no authorization
// scheme of its own.
export function createDiscoveryRouter(service: DiscoveryService): Router {
  const router = Router();
  const handlers = createDiscoveryHandlers(service);

  router.get('/discovery/content', asyncHandler(handlers.searchContent));

  return router;
}
