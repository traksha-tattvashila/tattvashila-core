import type { Request, Response } from 'express';

import type { VerificationOrchestrationService } from '../orchestration/orchestration-service.js';
import type {
  ConfirmVerificationResponse,
  InitiateVerificationResponse,
} from './responses.js';
import {
  ConfirmVerificationSchema,
  InitiateVerificationSchema,
} from './validation.js';

// ─── Verification handlers ────────────────────────────────────────────────────
// Each handler is a plain async function. Route binding (method, path,
// asyncHandler wrapper) is the responsibility of routes.ts.
// Handlers validate input, call the orchestration service, and return JSON.
// All errors are forwarded to next() and resolved by the global error handler.

export interface VerificationHandlers {
  initiate(req: Request, res: Response): Promise<void>;
  confirm(req: Request<{ verificationId: string }>, res: Response): Promise<void>;
}

export function createVerificationHandlers(
  service: VerificationOrchestrationService,
): VerificationHandlers {
  // ── POST /verifications ──────────────────────────────────────────────────
  async function initiate(req: Request, res: Response): Promise<void> {
    const parsed = InitiateVerificationSchema.safeParse(req.body);

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

    const { phone, email } = parsed.data;
    const result = await service.initiate(phone, email);

    const body: InitiateVerificationResponse = {
      sessionId: result.sessionId,
      phoneVerificationId: result.phoneVerificationId,
      emailVerificationId: result.emailVerificationId,
    };

    res.status(201).json(body);
  }

  // ── POST /verifications/:verificationId/confirm ──────────────────────────
  async function confirm(
    req: Request<{ verificationId: string }>,
    res: Response,
  ): Promise<void> {
    const { verificationId } = req.params;

    const parsed = ConfirmVerificationSchema.safeParse(req.body);

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

    const { otp } = parsed.data;
    const result = await service.confirm(verificationId, otp);

    const body: ConfirmVerificationResponse = {
      verified: true,
      sessionComplete: result.sessionComplete,
      ...(result.identity !== undefined && { identity: result.identity }),
    };

    res.status(200).json(body);
  }

  return { initiate, confirm };
}
