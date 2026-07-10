import type { RequestHandler } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { MembershipService } from '../membership-service.js';
import { createMembershipHandlers } from './membership-handlers.js';

// ─── Tattvaloka membership router ─────────────────────────────────────────────
// Mounts (relative to the parent /tattvaloka prefix):
//   POST /membership     — register the authenticated identity as a member
//   GET  /membership/me  — retrieve the authenticated identity's membership
//
// requireAuth is received as an already-constructed RequestHandler so this
// router has no dependency on the auth module's internals. The caller
// (http/routes/index.ts) is responsible for constructing it from authService.
export function createMembershipRouter(
  requireAuth: RequestHandler,
  membershipService: MembershipService,
): Router {
  const router = Router();
  const handlers = createMembershipHandlers(membershipService);

  router.post('/membership', requireAuth, asyncHandler(handlers.registerMembership));

  router.get('/membership/me', requireAuth, asyncHandler(handlers.getMyMembership));

  return router;
}
