import type { Request, Response } from 'express';

import type { DiscoveryService } from '../discovery-service.js';
import { toContentSearchResultResponse } from './discovery-responses.js';
import { ContentSearchQuerySchema } from './discovery-validation.js';

function sendValidationError(res: Response, error: { flatten(): unknown }): void {
  res.status(400).json({
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid request query.',
      details: (error.flatten as () => { fieldErrors: unknown })().fieldErrors,
    },
  });
}

// ─── Tattvapeetha discovery handlers ────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper) is the responsibility of routes.ts. Handlers call
// the discovery service and return JSON; no business logic lives here.
export interface DiscoveryHandlers {
  searchContent(req: Request, res: Response): Promise<void>;
}

export function createDiscoveryHandlers(service: DiscoveryService): DiscoveryHandlers {
  return {
    async searchContent(req, res) {
      const parsed = ContentSearchQuerySchema.safeParse(req.query);
      if (!parsed.success) {
        sendValidationError(res, parsed.error);
        return;
      }
      const results = await service.searchContent(parsed.data.q);
      res.status(200).json(results.map(toContentSearchResultResponse));
    },
  };
}
