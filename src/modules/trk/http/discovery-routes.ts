import type { Request } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { IdentityDiscoveryService } from '../discovery-service.js';
import { createDiscoveryHandlers } from './discovery-handlers.js';

// ─── Identity discovery router ────────────────────────────────────────────────
// Mounts a single read-only endpoint:
//   GET /public/:publicId — retrieve an identity by its active public identifier
//
// Registered as its own router (separate from the UUID-keyed identity router)
// so frozen Sprint 6/7 routers are never modified. Both are mounted under the
// same `/identities` prefix in http/routes/index.ts.
//
// The two-segment path (/public/:publicId) does not conflict with the existing
// one-segment path (/:id) because Express matches by segment count.
export function createIdentityDiscoveryRouter(
  service: IdentityDiscoveryService,
): Router {
  const router = Router();
  const handlers = createDiscoveryHandlers(service);

  router.get(
    '/public/:publicId',
    asyncHandler((req, res) =>
      handlers.getByPublicId(
        req as Request<{ publicId: string }>,
        res,
      ),
    ),
  );

  return router;
}
