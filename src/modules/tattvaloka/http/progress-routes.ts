import type { Request, RequestHandler } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { ProgressService } from '../progress-service.js';
import { createProgressHandlers } from './progress-handlers.js';

// ─── Tattvaloka progress router ─────────────────────────────────────────────────
// Mounts (relative to the parent /tattvaloka prefix), all under /progress:
//   POST /progress/units/:unitId/start     — start progress on a unit
//   POST /progress/units/:unitId/complete  — mark a unit as completed
//   GET  /progress/units/:unitId           — retrieve progress for a unit
//   POST /progress/aggregate               — compute aggregate progress over
//                                             a caller-supplied set of units
//
// All routes act on the authenticated identity's own membership — there is
// no notion of viewing another identity's progress in this sprint.
// /progress/aggregate uses POST (not GET) purely to carry a unitIds array in
// the request body; it performs no mutation.
//
// requireAuth is received as an already-constructed RequestHandler so this
// router has no dependency on the auth module's internals, matching the
// existing membership router convention.
export function createProgressRouter(
  requireAuth: RequestHandler,
  progressService: ProgressService,
): Router {
  const router = Router();
  const handlers = createProgressHandlers(progressService);

  router.post(
    '/progress/units/:unitId/start',
    requireAuth,
    asyncHandler((req, res) =>
      handlers.startUnitProgress(req as Request<{ unitId: string }>, res),
    ),
  );

  router.post(
    '/progress/units/:unitId/complete',
    requireAuth,
    asyncHandler((req, res) =>
      handlers.completeUnitProgress(req as Request<{ unitId: string }>, res),
    ),
  );

  router.get(
    '/progress/units/:unitId',
    requireAuth,
    asyncHandler((req, res) =>
      handlers.getUnitProgress(req as Request<{ unitId: string }>, res),
    ),
  );

  router.post(
    '/progress/aggregate',
    requireAuth,
    asyncHandler(handlers.getAggregateProgress),
  );

  return router;
}
