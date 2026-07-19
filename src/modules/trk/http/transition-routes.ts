import type { Request, RequestHandler } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { TrkTransitionService } from '../transition-service.js';
import { createTrkTransitionHandlers } from './transition-handlers.js';

// ─── TRK transition router ────────────────────────────────────────────────────
// Mounts a single action endpoint:
//   POST /:id/transition-to-trk — upgrade the identity from TMP to TRK
//
// requireAuth is received as an already-constructed RequestHandler so this
// router has no dependency on the auth module's internals. The caller
// (http/routes/index.ts) is responsible for constructing it from authService.
//
// Registered as its own router (separate from createIdentityRouter) so the
// frozen Sprint 6 retrieval router is never modified to add Sprint 7
// behaviour. Both routers are mounted under the same `/identities` prefix.
export function createTrkTransitionRouter(
  requireAuth: RequestHandler,
  service: TrkTransitionService,
): Router {
  const router = Router();
  const handlers = createTrkTransitionHandlers(service);

  // Cast req to the typed param shape expected by the handler. Express
  // populates req.params at runtime; the cast is safe because the route
  // pattern guarantees :id is present.
  router.post(
    '/:id/transition-to-trk',
    requireAuth,
    asyncHandler((req, res) =>
      handlers.transitionToTrk(req as Request<{ id: string }>, res),
    ),
  );

  return router;
}
