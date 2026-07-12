import type { Request } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { TattvapeethaService } from '../service.js';
import { createTattvapeethaHandlers } from './handlers.js';

// ─── Tattvapeetha router ─────────────────────────────────────────────────────────
// Mounts:
//   POST /tattvapeetha                             — register a new entity owned
//                                                     by the given institution
//   GET  /tattvapeetha/institutions/:institutionId — retrieve the entity owned
//                                                     by an institution
//
// The Tattvapeetha Constitutional Foundation sprint defines no authorization
// scheme of its own — endpoints follow the same unauthenticated pattern
// already used for institution registration (ins/http/routes.ts) and content
// architecture (tattvaloka/http/content-routes.ts).
export function createTattvapeethaRouter(service: TattvapeethaService): Router {
  const router = Router();
  const handlers = createTattvapeethaHandlers(service);

  router.post('/tattvapeetha', asyncHandler(handlers.registerEntity));

  router.get(
    '/tattvapeetha/institutions/:institutionId',
    asyncHandler((req, res) =>
      handlers.getEntityByInstitutionId(
        req as Request<{ institutionId: string }>,
        res,
      ),
    ),
  );

  return router;
}
