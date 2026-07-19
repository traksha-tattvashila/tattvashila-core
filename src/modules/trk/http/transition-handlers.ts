import type { Request, Response } from 'express';

import {
  AuthorizationError,
  AuthorizationErrorCode,
} from '../../../modules/authorization/errors.js';
import type { TrkTransitionService } from '../transition-service.js';
import type { IdentityResponse } from './responses.js';
import { toIdentityResponse } from './responses.js';
import { IdentityIdParamSchema } from './validation.js';

// ─── Authenticated request shape ──────────────────────────────────────────────
// identityId is set on the request by the auth middleware (requireAuth)
// before any transition handler runs.
interface AuthenticatedRequest extends Request {
  identityId: string;
}

// ─── Transition handlers ──────────────────────────────────────────────────────
// Thin HTTP adapter over TrkTransitionService: validate the path param,
// enforce caller ownership, delegate to the domain service, and serialise
// the result. All transition rules (eligibility, atomicity, idempotency)
// live in the service and repository — nothing here ever inspects or
// compares identity state.

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

    // ── Ownership check ──────────────────────────────────────────────────
    // A caller may only transition their own identity. The authenticated
    // identity (from the Bearer token, set by requireAuth) must match the
    // :id in the path — a person cannot trigger a TRK transition for any
    // identity other than their own.
    const { identityId } = req as unknown as AuthenticatedRequest;
    if (identityId !== parsed.data.id) {
      throw new AuthorizationError(
        'You are not authorised to transition this identity.',
        AuthorizationErrorCode.FORBIDDEN,
      );
    }

    const identity = await service.transitionToTrk(parsed.data.id);

    const body: IdentityResponse = toIdentityResponse(identity);
    res.status(200).json(body);
  }

  return { transitionToTrk };
}
