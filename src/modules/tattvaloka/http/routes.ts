import type { RequestHandler } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { TattvalokaService } from '../service.js';
import { createTattvalokaHandlers } from './handlers.js';

// ─── Tattvaloka router ─────────────────────────────────────────────────────────
// Mounts:
//   POST /     — register the authenticated identity as a Tattvaloka participant
//   GET  /me   — retrieve the authenticated identity's participant record
//
// requireAuth is received as an already-constructed RequestHandler so this
// router has no dependency on the auth module's internals. The caller
// (http/routes/index.ts) is responsible for constructing it from authService.
export function createTattvalokaRouter(
  requireAuth: RequestHandler,
  tattvalokaService: TattvalokaService,
): Router {
  const router = Router();
  const handlers = createTattvalokaHandlers(tattvalokaService);

  router.post('/', requireAuth, asyncHandler(handlers.registerParticipant));

  router.get('/me', requireAuth, asyncHandler(handlers.getMyParticipation));

  return router;
}
