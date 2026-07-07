import type { NextFunction, Request, RequestHandler, Response } from 'express';

import { AppError } from '../../../infrastructure/errors/app-error.js';
import { hasPermission } from '../engine.js';
import { AuthorizationError, AuthorizationErrorCode } from '../errors.js';
import type { AuthorizationService } from '../service.js';
import type { AuthorizedRequest } from './types.js';

// ─── Resolve permissions middleware ──────────────────────────────────────────
// Must run after the auth middleware (requireAuth from Sprint 9) which
// populates req.identityId. Loads the identity's resolved permissions from
// the database and attaches them to the request so that subsequent
// requirePermission guards can evaluate them synchronously.
//
// Usage in a route chain:
//   router.get('/path', requireAuth, resolvePermissions, requirePermission(...), handler)
export function createResolvePermissionsMiddleware(
  service: AuthorizationService,
): RequestHandler {
  return function (req: Request, _res: Response, next: NextFunction): void {
    const identityId = (req as { identityId?: string }).identityId;

    if (!identityId) {
      next(
        new AppError(
          'Permission resolution requires an authenticated request. Ensure requireAuth runs before resolvePermissions.',
          'AUTHZ_MISSING_IDENTITY',
          500,
        ),
      );
      return;
    }

    service
      .resolvePermissionsForIdentity(identityId)
      .then((resolved) => {
        (req as AuthorizedRequest).resolvedPermissions = resolved;
        next();
      })
      .catch(next);
  };
}

// ─── Permission guard ─────────────────────────────────────────────────────────
// Returns middleware that asserts the authenticated identity holds the
// required (resource, action) permission. Must run after
// createResolvePermissionsMiddleware so that resolvedPermissions is present
// on the request.
//
// This is a synchronous guard — it reads the permissions already attached to
// the request by createResolvePermissionsMiddleware and calls the pure engine.
// No database access occurs here.
export function requirePermission(resource: string, action: string): RequestHandler {
  return function (req: Request, _res: Response, next: NextFunction): void {
    const resolved = (req as { resolvedPermissions?: AuthorizedRequest['resolvedPermissions'] })
      .resolvedPermissions;

    if (resolved === undefined) {
      next(
        new AppError(
          'Permission check requires permissions to be resolved first. Ensure resolvePermissions runs before requirePermission.',
          'AUTHZ_MISSING_RESOLVED',
          500,
        ),
      );
      return;
    }

    if (!hasPermission(resolved, resource, action)) {
      next(
        new AuthorizationError(
          `Permission denied: "${resource}:${action}" is required.`,
          AuthorizationErrorCode.FORBIDDEN,
        ),
      );
      return;
    }

    next();
  };
}
