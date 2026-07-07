import type { Request } from 'express';

import type { ResolvedPermissions } from '../models.js';

// ─── Authorized request ───────────────────────────────────────────────────────
// Populated in two stages by the middleware chain:
//   1. identityId       — set by the auth middleware (Sprint 9, requireAuth)
//   2. resolvedPermissions — set by createResolvePermissionsMiddleware
//
// Any handler that reads resolvedPermissions must be preceded by both
// requireAuth and createResolvePermissionsMiddleware in its route chain.
export interface AuthorizedRequest extends Request {
  identityId: string;
  resolvedPermissions: ResolvedPermissions;
}
