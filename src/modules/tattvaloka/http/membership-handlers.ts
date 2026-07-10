import type { Request, Response } from 'express';

import type { MembershipService } from '../membership-service.js';
import { toMembershipResponse } from './membership-responses.js';
import { RegisterMembershipBodySchema } from './membership-validation.js';

// ─── Authenticated request shape ──────────────────────────────────────────────
// identityId is set on the request by the auth middleware (requireAuth,
// Sprint 9) before any membership handler runs.
interface AuthenticatedRequest extends Request {
  identityId: string;
}

// ─── Tattvaloka membership handlers ───────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper, middleware) is the responsibility of routes.ts.
// Handlers call the membership service and return JSON; no business logic
// lives here.
export interface MembershipHandlers {
  registerMembership(req: Request, res: Response): Promise<void>;
  getMyMembership(req: Request, res: Response): Promise<void>;
}

export function createMembershipHandlers(service: MembershipService): MembershipHandlers {
  // ── POST /tattvaloka/membership ───────────────────────────────────────────
  // Registers the authenticated identity as a Tattvaloka member.
  async function registerMembership(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;

    const parsed = RegisterMembershipBodySchema.safeParse(req.body ?? {});
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

    const membership = await service.registerMembership(identityId);

    res.status(201).json(toMembershipResponse(membership));
  }

  // ── GET /tattvaloka/membership/me ─────────────────────────────────────────
  // Returns the membership record for the authenticated identity.
  async function getMyMembership(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;

    const membership = await service.getMembership(identityId);

    res.status(200).json(toMembershipResponse(membership));
  }

  return { registerMembership, getMyMembership };
}
