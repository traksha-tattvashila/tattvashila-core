import type { RequestHandler } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { ProfileService } from '../service.js';
import { createProfileHandlers } from './handlers.js';

// ─── Profile router ───────────────────────────────────────────────────────────
// Mounts:
//   POST  /          — create the authenticated identity's profile
//   GET   /me        — retrieve the authenticated identity's profile
//   PATCH /me        — update the authenticated identity's profile
//
// requireAuth is received as an already-constructed RequestHandler so this
// router has no dependency on the auth module's internals. The caller
// (http/routes/index.ts) is responsible for constructing it from authService.
export function createProfileRouter(
  requireAuth: RequestHandler,
  profileService: ProfileService,
): Router {
  const router = Router();
  const handlers = createProfileHandlers(profileService);

  router.post('/', requireAuth, asyncHandler(handlers.createProfile));

  router.get('/me', requireAuth, asyncHandler(handlers.getMyProfile));

  router.patch('/me', requireAuth, asyncHandler(handlers.updateMyProfile));

  return router;
}
