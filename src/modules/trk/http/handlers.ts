import type { Request, Response } from 'express';

import type { IdentityService } from '../service.js';
import type { IdentityResponse } from './responses.js';
import { toIdentityResponse } from './responses.js';
import {
  IdentityByContactQuerySchema,
  IdentityIdParamSchema,
} from './validation.js';

// ─── Identity handlers ────────────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper) is the responsibility of routes.ts.
// Handlers validate input, call the identity service, and return JSON.
// All errors are forwarded to next() and resolved by the global error handler.

export interface IdentityHandlers {
  getById(req: Request<{ id: string }>, res: Response): Promise<void>;
  getByContact(req: Request, res: Response): Promise<void>;
}

export function createIdentityHandlers(service: IdentityService): IdentityHandlers {
  // ── GET /identities/:id ───────────────────────────────────────────────────
  async function getById(
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

    const identity = await service.getById(parsed.data.id);

    const body: IdentityResponse = toIdentityResponse(identity);
    res.status(200).json(body);
  }

  // ── GET /identities?contactType=&contactValue= ───────────────────────────
  async function getByContact(req: Request, res: Response): Promise<void> {
    const parsed = IdentityByContactQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid contact lookup query.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { contactType, contactValue } = parsed.data;
    const identity = await service.getByVerifiedContact(contactType, contactValue);

    const body: IdentityResponse = toIdentityResponse(identity);
    res.status(200).json(body);
  }

  return { getById, getByContact };
}
