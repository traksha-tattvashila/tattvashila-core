import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import { createAuthMiddleware } from '../../auth/http/middleware.js';
import type { AuthService } from '../../auth/service.js';
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
// as the canonical way for other route modules to protect individual routes.
// Usage in another router:
//   import { createResolvePermissionsMiddleware, requirePermission }
//     from '../../authorization/http/middleware.js';
export { createResolvePermissionsMiddleware, requirePermission };

export function createAuthorizationRouter(
  authService: AuthService,
  authorizationService: AuthorizationService,
): Router {
  const router = Router();
  const handlers = createAuthorizationHandlers();
  const requireAuth = createAuthMiddleware(authService);
  const resolvePermissions = createResolvePermissionsMiddleware(authorizationService);

  router.get(
    '/me',
    requireAuth,
    resolvePermissions,
    asyncHandler(handlers.getMyPermissions),
  );

  return router;
}
