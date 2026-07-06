import type { Request } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { IdentityService } from '../service.js';
import { createIdentityHandlers } from './handlers.js';

// ─── Identity router ───────────────────────────────────────────────────────────
// Mounts two read-only endpoints:
//   GET /?contactType=&contactValue= — retrieve an identity by verified contact
//   GET /:id                         — retrieve an identity by its UUID
//
// The exact-path query route is registered before the parameterised route so
// requests to the bare collection path never fall through to :id matching.
// All handler errors are forwarded to next() by asyncHandler and resolved by
// the global error handler registered in server.ts.
export function createIdentityRouter(service: IdentityService): Router {
  const router = Router();
  const handlers = createIdentityHandlers(service);

  router.get('/', asyncHandler(handlers.getByContact));

  // Cast req to the typed param shape expected by the getById handler.
  // Express populates req.params at runtime; the cast is safe because the
  // route pattern guarantees :id is present.
  router.get(
    '/:id',
    asyncHandler((req, res) => handlers.getById(req as Request<{ id: string }>, res)),
  );

  return router;
}
