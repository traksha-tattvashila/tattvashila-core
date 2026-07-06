import type { Request, Response } from 'express';

import type { IdentityService } from '../../trk/service.js';
import type { AuthService } from '../service.js';
import type { AuthenticatedRequest } from './types.js';
import type { SessionResponse, TokenPairResponse } from './responses.js';
import { toTokenPairResponse } from './responses.js';
import {
  LoginSchema,
  LogoutSchema,
  RefreshSchema,
  SetCredentialSchema,
} from './validation.js';

// ─── Auth handlers ────────────────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper, middleware) is the responsibility of routes.ts.
// Handlers validate input, call the auth service, and return JSON.
// All errors are forwarded to next() and resolved by the global error handler.

export interface AuthHandlers {
  setCredential(req: Request, res: Response): Promise<void>;
  login(req: Request, res: Response): Promise<void>;
  refresh(req: Request, res: Response): Promise<void>;
  logout(req: Request, res: Response): Promise<void>;
  session(req: Request, res: Response): Promise<void>;
}

function validationError(res: Response, message: string, details: unknown): void {
  res.status(400).json({
    error: { code: 'VALIDATION_ERROR', message, details },
  });
}

export function createAuthHandlers(
  service: AuthService,
  identityService: IdentityService,
): AuthHandlers {
  // ── POST /auth/credentials ────────────────────────────────────────────────
  async function setCredential(req: Request, res: Response): Promise<void> {
    const parsed = SetCredentialSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, 'Invalid request body.', parsed.error.flatten().fieldErrors);
      return;
    }

    const { identityId, password } = parsed.data;
    await service.setCredential(identityId, password);

    res.status(201).json({ identityId });
  }

  // ── POST /auth/login ──────────────────────────────────────────────────────
  async function login(req: Request, res: Response): Promise<void> {
    const parsed = LoginSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, 'Invalid request body.', parsed.error.flatten().fieldErrors);
      return;
    }

    const { contactType, contactValue, password } = parsed.data;
    const pair = await service.login(contactType, contactValue, password);

    const body: TokenPairResponse = toTokenPairResponse(pair);
    res.status(200).json(body);
  }

  // ── POST /auth/refresh ────────────────────────────────────────────────────
  async function refresh(req: Request, res: Response): Promise<void> {
    const parsed = RefreshSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, 'Invalid request body.', parsed.error.flatten().fieldErrors);
      return;
    }

    const pair = await service.refresh(parsed.data.refreshToken);

    const body: TokenPairResponse = toTokenPairResponse(pair);
    res.status(200).json(body);
  }

  // ── POST /auth/logout ─────────────────────────────────────────────────────
  async function logout(req: Request, res: Response): Promise<void> {
    const parsed = LogoutSchema.safeParse(req.body);
    if (!parsed.success) {
      validationError(res, 'Invalid request body.', parsed.error.flatten().fieldErrors);
      return;
    }

    await service.logout(parsed.data.refreshToken);
    res.status(204).send();
  }

  // ── GET /auth/session ─────────────────────────────────────────────────────
  // Protected by the auth middleware; req.identityId is guaranteed present.
  async function session(req: Request, res: Response): Promise<void> {
    const { identityId } = req as AuthenticatedRequest;
    const identity = await identityService.getById(identityId);

    const body: SessionResponse = {
      identityId: identity.id,
      identityState: identity.state,
    };
    res.status(200).json(body);
  }

  return { setCredential, login, refresh, logout, session };
}
