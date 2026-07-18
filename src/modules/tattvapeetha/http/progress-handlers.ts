import type { Request, Response } from 'express';

import type { ProgressService } from '../progress-service.js';
import {
  toAggregateProgressResponse,
  toUnitProgressResponse,
} from './progress-responses.js';
import { AggregateProgressBodySchema } from './progress-validation.js';

// ─── Authenticated request shape ──────────────────────────────────────────────
// identityId is set on the request by the auth middleware (requireAuth,
// Sprint 9) before any progress handler runs.
interface AuthenticatedRequest extends Request {
  identityId: string;
}

function sendValidationError(res: Response, error: { flatten(): unknown }): void {
  res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request body.',
      details: (error.flatten as () => { fieldErrors: unknown })().fieldErrors,
    },
  });
}

// ─── Tattvapeetha progress handlers ─────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper, requireAuth middleware) is the responsibility of
// routes.ts. Handlers call the progress service and return JSON; no
// business logic lives here.
export interface ProgressHandlers {
  startUnitProgress(req: Request<{ unitId: string }>, res: Response): Promise<void>;
  completeUnitProgress(req: Request<{ unitId: string }>, res: Response): Promise<void>;
  getUnitProgress(req: Request<{ unitId: string }>, res: Response): Promise<void>;
  getAggregateProgress(req: Request, res: Response): Promise<void>;
}

export function createProgressHandlers(service: ProgressService): ProgressHandlers {
  return {
    async startUnitProgress(req, res) {
      const { identityId } = req as unknown as AuthenticatedRequest;
      const progress = await service.startUnitProgress(identityId, req.params.unitId);
      res.status(200).json(toUnitProgressResponse(progress));
    },

    async completeUnitProgress(req, res) {
      const { identityId } = req as unknown as AuthenticatedRequest;
      const progress = await service.completeUnitProgress(identityId, req.params.unitId);
      res.status(200).json(toUnitProgressResponse(progress));
    },

    async getUnitProgress(req, res) {
      const { identityId } = req as unknown as AuthenticatedRequest;
      const progress = await service.getUnitProgress(identityId, req.params.unitId);
      res.status(200).json(toUnitProgressResponse(progress));
    },

    async getAggregateProgress(req, res) {
      const { identityId } = req as AuthenticatedRequest;

      const parsed = AggregateProgressBodySchema.safeParse(req.body ?? {});
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }

      const aggregate = await service.getAggregateProgress(identityId, parsed.data.unitIds);
      res.status(200).json(toAggregateProgressResponse(aggregate));
    },
  };
}
