import type { Request, Response } from 'express';

import type { TrkTransitionService } from '../transition-service.js';
import type { IdentityResponse } from './responses.js';
import { toIdentityResponse } from './responses.js';
import { IdentityIdParamSchema } from './validation.js';

// ─── Transition handlers ──────────────────────────────────────────────────────
// Thin HTTP adapter over TrkTransitionService: validate the path param,
// delegate to the domain service, and serialise the result. All transition
// rules (eligibility, atomicity, idempotency) live in the service and
// repository — nothing here ever inspects or compares identity state.

export interface TrkTransitionHandlers {
  transitionToTrk(req: Request<{ id: string }>, res: Response): Promise<void>;
}

export function createTrkTransitionHandlers(
  service: TrkTransitionService,
): TrkTransitionHandlers {
  // ── POST /identities/:id/transition-to-trk ───────────────────────────────
  async function transitionToTrk(
    req: Request<{ id: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = IdentityIdParamSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid identity id.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const identity = await service.transitionToTrk(parsed.data.id);

    const body: IdentityResponse = toIdentityResponse(identity);
    res.status(200).json(body);
  }

  return { transitionToTrk };
}
