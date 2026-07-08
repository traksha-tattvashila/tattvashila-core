import type { Request, Response } from 'express';

import type { IdentityDiscoveryService } from '../discovery-service.js';
import type { IdentityResponse } from './responses.js';
import { toIdentityResponse } from './responses.js';
import { PublicIdParamSchema } from './discovery-validation.js';

// ─── Discovery handlers ───────────────────────────────────────────────────────
// Thin HTTP adapter over IdentityDiscoveryService.
// Validates the path parameter, delegates to the service, and serialises the
// result. All error propagation goes through next() via asyncHandler.

export interface DiscoveryHandlers {
  getByPublicId(
    req: Request<{ publicId: string }>,
    res: Response,
  ): Promise<void>;
}

export function createDiscoveryHandlers(
  service: IdentityDiscoveryService,
): DiscoveryHandlers {
  // ── GET /identities/public/:publicId ─────────────────────────────────────
  async function getByPublicId(
    req: Request<{ publicId: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = PublicIdParamSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid public identifier.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const identity = await service.getByPublicId(parsed.data.publicId);

    const body: IdentityResponse = toIdentityResponse(identity);
    res.status(200).json(body);
  }

  return { getByPublicId };
}
