import type { Request, Response } from 'express';

import type { MePermissionsResponse } from './responses.js';
import type { AuthorizedRequest } from './types.js';

// ─── Authorization handlers ───────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper, middleware) is the responsibility of routes.ts.

export interface AuthorizationHandlers {
  getMyPermissions(req: Request, res: Response): Promise<void>;
}

export function createAuthorizationHandlers(): AuthorizationHandlers {
  // ── GET /authorization/me ─────────────────────────────────────────────────
  // Returns the authenticated identity's resolved permission set.
  // Requires: requireAuth → resolvePermissions in the route chain.
  // Reading your own permissions is always allowed for any authenticated
  // identity — no permission guard is needed on this endpoint itself.
  async function getMyPermissions(req: Request, res: Response): Promise<void> {
    const { identityId, resolvedPermissions } = req as AuthorizedRequest;

    const sorted = [...resolvedPermissions.permissions].sort();

    const body: MePermissionsResponse = {
      identityId,
      permissions: sorted,
    };

    res.status(200).json(body);
  }

  return { getMyPermissions };
}
