import type { Request, Response } from 'express';
import { Router } from 'express';

import { asyncHandler } from '../../../http/middleware/async-handler.js';
import type { VerificationOrchestrationService } from '../orchestration/orchestration-service.js';
import { createVerificationHandlers } from './handlers.js';

// ─── Verification router ──────────────────────────────────────────────────────
// Mounts two endpoints:
//   POST /            — initiate dual verification (phone + email)
//   POST /:id/confirm — submit OTP for one channel
//
// All handler errors are forwarded to next() by asyncHandler and resolved by
// the global error handler registered in server.ts.
export function createVerificationRouter(
  service: VerificationOrchestrationService,
): Router {
  const router = Router();
  const handlers = createVerificationHandlers(service);

  router.post('/', asyncHandler(handlers.initiate));

  // Cast req to the typed param shape expected by the confirm handler.
  // Express populates req.params at runtime; the cast is safe because the
  // route pattern guarantees :verificationId is present.
  router.post(
    '/:verificationId/confirm',
    asyncHandler((req, res) =>
      handlers.confirm(req as Request<{ verificationId: string }>, res),
    ),
  );

  return router;
}
