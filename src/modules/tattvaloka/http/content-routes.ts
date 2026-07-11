import type { Request } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { ContentService } from '../content-service.js';
import { createContentHandlers } from './content-handlers.js';

// ─── Tattvaloka content router ─────────────────────────────────────────────────
// Mounts (relative to the parent /tattvaloka prefix), all under /content:
//   POST /content/paths                     — create a content path
//   GET  /content/paths/:id                 — retrieve a content path
//   POST /content/paths/:id/status          — transition a path's status
//   POST /content/modules                   — create a content module
//   GET  /content/modules/:id               — retrieve a content module
//   POST /content/modules/:id/status        — transition a module's status
//   POST /content/units                     — create a content unit
//   GET  /content/units/:id                 — retrieve a content unit
//   POST /content/units/:id/versions        — add a new immutable version
//   GET  /content/units/:id/versions/current — retrieve the current version
//   POST /content/units/:id/publish         — publish a unit
//   POST /content/units/:id/retire          — retire a unit
//
// Content architecture (Sprint 17) defines structure only — no authorization
// scheme is specified by this sprint. Endpoints follow the same
// unauthenticated pattern already used for institution registration
// (ins/http/routes.ts); access control for content authoring is left to a
// future sprint or constitutional amendment.
export function createContentRouter(service: ContentService): Router {
  const router = Router();
  const handlers = createContentHandlers(service);

  router.post('/content/paths', asyncHandler(handlers.createPath));
  router.get(
    '/content/paths/:id',
    asyncHandler((req, res) => handlers.getPath(req as Request<{ id: string }>, res)),
  );
  router.post(
    '/content/paths/:id/status',
    asyncHandler((req, res) =>
      handlers.transitionPathStatus(req as Request<{ id: string }>, res),
    ),
  );

  router.post('/content/modules', asyncHandler(handlers.createModule));
  router.get(
    '/content/modules/:id',
    asyncHandler((req, res) => handlers.getModule(req as Request<{ id: string }>, res)),
  );
  router.post(
    '/content/modules/:id/status',
    asyncHandler((req, res) =>
      handlers.transitionModuleStatus(req as Request<{ id: string }>, res),
    ),
  );

  router.post('/content/units', asyncHandler(handlers.createUnit));
  router.get(
    '/content/units/:id',
    asyncHandler((req, res) => handlers.getUnit(req as Request<{ id: string }>, res)),
  );
  router.post(
    '/content/units/:id/versions',
    asyncHandler((req, res) => handlers.addUnitVersion(req as Request<{ id: string }>, res)),
  );
  router.get(
    '/content/units/:id/versions/current',
    asyncHandler((req, res) =>
      handlers.getCurrentVersion(req as Request<{ id: string }>, res),
    ),
  );
  router.post(
    '/content/units/:id/publish',
    asyncHandler((req, res) => handlers.publishUnit(req as Request<{ id: string }>, res)),
  );
  router.post(
    '/content/units/:id/retire',
    asyncHandler((req, res) => handlers.retireUnit(req as Request<{ id: string }>, res)),
  );

  return router;
}
