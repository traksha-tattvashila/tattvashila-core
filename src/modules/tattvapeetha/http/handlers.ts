import type { Request, Response } from 'express';

import type { TattvapeethaService } from '../service.js';
import { toTattvapeethaEntityResponse } from './responses.js';
import { RegisterEntityBodySchema } from './validation.js';

// ─── Tattvapeetha handlers ───────────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper) is the responsibility of routes.ts. Handlers call
// the Tattvapeetha service and return JSON; no business logic lives here.
export interface TattvapeethaHandlers {
  registerEntity(req: Request, res: Response): Promise<void>;
  getEntityByInstitutionId(
    req: Request<{ institutionId: string }>,
    res: Response,
  ): Promise<void>;
}

export function createTattvapeethaHandlers(
  service: TattvapeethaService,
): TattvapeethaHandlers {
  // ── POST /tattvapeetha ───────────────────────────────────────────────────────
  // Registers a new Tattvapeetha entity owned by the given institution.
  async function registerEntity(req: Request, res: Response): Promise<void> {
    const parsed = RegisterEntityBodySchema.safeParse(req.body ?? {});
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

    const entity = await service.registerEntity(parsed.data.institutionId);

    res.status(201).json(toTattvapeethaEntityResponse(entity));
  }

  // ── GET /tattvapeetha/institutions/:institutionId ───────────────────────────
  // Returns the Tattvapeetha entity owned by the given institution.
  async function getEntityByInstitutionId(
    req: Request<{ institutionId: string }>,
    res: Response,
  ): Promise<void> {
    const entity = await service.getEntity(req.params.institutionId);

    res.status(200).json(toTattvapeethaEntityResponse(entity));
  }

  return { registerEntity, getEntityByInstitutionId };
}
