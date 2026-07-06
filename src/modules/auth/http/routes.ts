import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { IdentityService } from '../../trk/service.js';
import type { AuthService } from '../service.js';
import { createAuthHandlers } from './handlers.js';
import { createAuthMiddleware } from './middleware.js';

// ─── Auth router ──────────────────────────────────────────────────────────────
// Mounts:
//   POST /credentials — set the password credential for an existing identity
//   POST /login       — authenticate by verified contact + password
//   POST /refresh     — rotate a refresh token for a new access/refresh pair
//   POST /logout      — revoke a refresh token
//   GET  /session      — protected; returns the authenticated identity
//
// All handler errors are forwarded to next() by asyncHandler and resolved by
// the global error handler registered in server.ts.
export function createAuthRouter(
  authService: AuthService,
  identityService: IdentityService,
): Router {
  const router = Router();
  const handlers = createAuthHandlers(authService, identityService);
  const requireAuth = createAuthMiddleware(authService);

  router.post('/credentials', asyncHandler(handlers.setCredential));
  router.post('/login', asyncHandler(handlers.login));
  router.post('/refresh', asyncHandler(handlers.refresh));
  router.post('/logout', asyncHandler(handlers.logout));
  router.get('/session', requireAuth, asyncHandler(handlers.session));

  return router;
}
