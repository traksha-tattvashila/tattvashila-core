import type { Request } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { InstitutionService } from '../service.js';
import { createInstitutionHandlers } from './handlers.js';

// ─── Institution router ───────────────────────────────────────────────────────
// Mounts two endpoints:
//   POST /               — register a new constitutional institution
//   GET  /public/:insId  — retrieve an institution by its INS identifier
//
// INS is the only constitutional external lookup key for institutions.
// No UUID-keyed read endpoint is provided — UUID remains internal.
export function createInstitutionRouter(service: InstitutionService): Router {
  const router = Router();
  const handlers = createInstitutionHandlers(service);

  router.post('/', asyncHandler(handlers.register));

  router.get(
    '/public/:insId',
    asyncHandler((req, res) =>
      handlers.getByInsId(req as Request<{ insId: string }>, res),
    ),
  );

  return router;
}
