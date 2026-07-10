import type { Request, Response } from 'express';

import type { InstitutionService } from '../service.js';
import type { InstitutionResponse } from './responses.js';
import { toInstitutionResponse } from './responses.js';
import {
  InsIdParamSchema,
  RegisterInstitutionBodySchema,
} from './validation.js';

// ─── Institution handlers ─────────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper) is the responsibility of routes.ts.
// Handlers validate input, call the institution service, and return JSON.
// All errors are forwarded to next() and resolved by the global error handler.

export interface InstitutionHandlers {
  register(req: Request, res: Response): Promise<void>;
  getByInsId(req: Request<{ insId: string }>, res: Response): Promise<void>;
}

export function createInstitutionHandlers(
  service: InstitutionService,
): InstitutionHandlers {
  // ── POST /institutions ────────────────────────────────────────────────────
  async function register(req: Request, res: Response): Promise<void> {
    const parsed = RegisterInstitutionBodySchema.safeParse(req.body);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid institution registration request.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const institution = await service.registerInstitution(parsed.data.name);

    const body: InstitutionResponse = toInstitutionResponse(institution);
    res.status(201).json(body);
  }

  // ── GET /institutions/public/:insId ───────────────────────────────────────
  async function getByInsId(
    req: Request<{ insId: string }>,
    res: Response,
  ): Promise<void> {
    const parsed = InsIdParamSchema.safeParse(req.params);

    if (!parsed.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid INS identifier.',
          details: parsed.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const institution = await service.getByInsId(parsed.data.insId);

    const body: InstitutionResponse = toInstitutionResponse(institution);
    res.status(200).json(body);
  }

  return { register, getByInsId };
}
