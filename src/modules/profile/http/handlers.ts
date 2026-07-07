import type { Request, Response } from 'express';

import type { ProfileService } from '../service.js';
import { toProfileResponse } from './responses.js';
import { CreateProfileSchema, UpdateProfileSchema } from './validation.js';

// ─── Authenticated request shape ──────────────────────────────────────────────
// identityId is set on the request by the auth middleware (requireAuth,
// Sprint 9) before any profile handler runs.
interface AuthenticatedRequest extends Request {
  identityId: string;
}

// ─── Profile handlers ─────────────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper, middleware) is the responsibility of routes.ts.
// Handlers validate input, call the profile service, and return JSON.
// All errors forwarded to next() are resolved by the global error handler.

export interface ProfileHandlers {
  createProfile(req: Request, res: Response): Promise<void>;
  getMyProfile(req: Request, res: Response): Promise<void>;
  updateMyProfile(req: Request, res: Response): Promise<void>;
}

export function createProfileHandlers(service: ProfileService): ProfileHandlers {
  // ── POST /profile ─────────────────────────────────────────────────────────
  // Creates a profile for the authenticated identity.
  async function createProfile(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;

    const parsed = CreateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile data.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const profile = await service.createProfile(identityId, {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
    });

    res.status(201).json(toProfileResponse(profile));
  }

  // ── GET /profile/me ───────────────────────────────────────────────────────
  // Returns the profile for the authenticated identity.
  async function getMyProfile(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;

    const profile = await service.getProfile(identityId);
    res.status(200).json(toProfileResponse(profile));
  }

  // ── PATCH /profile/me ─────────────────────────────────────────────────────
  // Updates mutable fields on the authenticated identity's profile.
  async function updateMyProfile(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;

    const parsed = UpdateProfileSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid profile update.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const profile = await service.updateProfile(identityId, {
      displayName: parsed.data.displayName,
      bio: parsed.data.bio,
    });

    res.status(200).json(toProfileResponse(profile));
  }

  return { createProfile, getMyProfile, updateMyProfile };
}
