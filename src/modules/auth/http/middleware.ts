import type { NextFunction, Request, Response } from 'express';

import type { AuthService } from '../service.js';
import { AuthError, AuthErrorCode } from '../errors.js';
import type { AuthenticatedRequest } from './types.js';

const BEARER_PREFIX = 'Bearer ';

// ─── Authentication middleware ───────────────────────────────────────────────
// Verifies the Authorization header carries a valid access token and
// attaches the resulting identityId to the request. Does not check
// permissions or roles — it only answers "is this a valid, authenticated
// request", which is the full scope of authentication in this sprint.
export function createAuthMiddleware(authService: AuthService) {
  return function (req: Request, _res: Response, next: NextFunction): void {
    const header = req.headers.authorization;

    if (!header || !header.startsWith(BEARER_PREFIX)) {
      next(
        new AuthError(
          'Missing or malformed Authorization header.',
          AuthErrorCode.ACCESS_TOKEN_INVALID,
        ),
      );
      return;
    }

    const token = header.slice(BEARER_PREFIX.length);

    try {
      const { identityId } = authService.verifyAccessToken(token);
      (req as AuthenticatedRequest).identityId = identityId;
      next();
    } catch (error) {
      next(error);
    }
  };
}
