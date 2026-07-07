import type { RequestHandler } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { AuthorizationService } from '../service.js';
import { createAuthorizationHandlers } from './handlers.js';
import {
  createResolvePermissionsMiddleware,
  requirePermission,
} from './middleware.js';

// ─── Authorization router ─────────────────────────────────────────────────────
// Mounts:
//   GET /me — returns the authenticated identity's resolved permission set
//
// requirePermission and createResolvePermissionsMiddleware are re-exported
// as the canonical primitives for other route modules to protect routes.
// Usage in another router:
//   import { createResolvePermissionsMiddleware, requirePermission }
//     from '../../authorization/http/middleware.js';
export { createResolvePermissionsMiddleware, requirePermission };

// requireAuth is received as an already-constructed RequestHandler so this
// router has no dependency on the auth module's internals. The caller
// (http/routes/index.ts) is responsible for constructing it from authService.
export function createAuthorizationRouter(
  requireAuth: RequestHandler,
  authorizationService: AuthorizationService,
): Router {
  const router = Router();
  const handlers = createAuthorizationHandlers();
  const resolvePermissions = createResolvePermissionsMiddleware(authorizationService);

  router.get(
    '/me',
    requireAuth,
    resolvePermissions,
    asyncHandler(handlers.getMyPermissions),
  );

  return router;
}
