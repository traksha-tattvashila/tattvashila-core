import type { Request, Response } from 'express';

import type { TattvalokaService } from '../service.js';
import { toTattvalokaParticipantResponse } from './responses.js';
import { RegisterParticipantBodySchema } from './validation.js';

// ─── Authenticated request shape ──────────────────────────────────────────────
// identityId is set on the request by the auth middleware (requireAuth,
// Sprint 9) before any Tattvaloka handler runs.
interface AuthenticatedRequest extends Request {
  identityId: string;
}

// ─── Tattvaloka handlers ───────────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper, middleware) is the responsibility of routes.ts.
// Handlers call the Tattvaloka service and return JSON; no business logic
// lives here.
export interface TattvalokaHandlers {
  registerParticipant(req: Request, res: Response): Promise<void>;
  getMyParticipation(req: Request, res: Response): Promise<void>;
}

export function createTattvalokaHandlers(
  service: TattvalokaService,
): TattvalokaHandlers {
  // ── POST /tattvaloka ───────────────────────────────────────────────────────
  // Registers the authenticated identity as a Tattvaloka participant.
  async function registerParticipant(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;

    const parsed = RegisterParticipantBodySchema.safeParse(req.body ?? {});
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid request body.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const participant = await service.registerParticipant(identityId);

    res.status(201).json(toTattvalokaParticipantResponse(participant));
  }

  // ── GET /tattvaloka/me ─────────────────────────────────────────────────────
  // Returns the Tattvaloka participant record for the authenticated identity.
  async function getMyParticipation(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;

    const participant = await service.getParticipant(identityId);

    res.status(200).json(toTattvalokaParticipantResponse(participant));
  }

  return { registerParticipant, getMyParticipation };
}
