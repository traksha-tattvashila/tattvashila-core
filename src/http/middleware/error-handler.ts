import type { NextFunction, Request, Response } from 'express';

import type { Logger } from '../../foundation/logger.js';
import { isAppError } from '../../infrastructure/errors/app-error.js';
import { IdentityErrorCode, isIdentityError } from '../../modules/trk/errors.js';
import { EngineErrorCode, isEngineError } from '../../modules/verification/errors.js';

// ─── Engine error → HTTP status mapping ──────────────────────────────────────
// EngineError carries a 400 statusCode by design (Sprint 4B); the HTTP layer
// maps engine codes to semantically correct 4xx codes here.
// The switch is exhaustive — TypeScript will fail to compile if a new
// EngineErrorCode is added without updating this mapping.
function httpStatusForEngineCode(code: EngineErrorCode): number {
  switch (code) {
    case EngineErrorCode.NOT_FOUND:
      return 404;
    case EngineErrorCode.ALREADY_CONSUMED:
      return 409;
    case EngineErrorCode.INVALID_OTP:
      return 422;
    case EngineErrorCode.MAX_ATTEMPTS_EXCEEDED:
      return 429;
    case EngineErrorCode.RESEND_COOLDOWN_ACTIVE:
      return 429;
    default: {
      // Exhaustiveness guard — new codes must be mapped above.
      const _: never = code;
      void _;
      return 400;
    }
  }
}

// ─── Identity error → HTTP status mapping ────────────────────────────────────
// IdentityError already carries the correct statusCode (404) set at
// construction, so no remapping switch is needed here — this function exists
// only to keep the mapping style consistent and exhaustive as codes are added.
function httpStatusForIdentityCode(code: IdentityErrorCode): number {
  switch (code) {
    case IdentityErrorCode.NOT_FOUND:
      return 404;
    default: {
      // Exhaustiveness guard — new codes must be mapped above.
      const _: never = code;
      void _;
      return 404;
    }
  }
}

// ─── Global error handler ─────────────────────────────────────────────────────
// Must be registered as the last middleware in the Express app so that
// errors forwarded via next(err) from all preceding handlers reach it.
// Response shape: { error: { code: string, message: string } }
export function errorHandler(logger: Logger) {
  return function (
    err: unknown,
    _req: Request,
    res: Response,
    _next: NextFunction,
  ): void {
    if (isEngineError(err)) {
      const status = httpStatusForEngineCode(err.engineCode);
      res.status(status).json({ error: { code: err.engineCode, message: err.message } });
      return;
    }

    if (isIdentityError(err)) {
      const status = httpStatusForIdentityCode(err.identityCode);
      res.status(status).json({ error: { code: err.identityCode, message: err.message } });
      return;
    }

    if (isAppError(err)) {
      res.status(err.statusCode).json({ error: { code: err.code, message: err.message } });
      return;
    }

    const message = err instanceof Error ? err.message : 'An unexpected error occurred.';
    logger.error('Unhandled error', {
      message,
      stack: err instanceof Error ? err.stack : undefined,
    });

    res.status(500).json({ error: { code: 'INTERNAL_ERROR', message: 'An internal error occurred.' } });
  };
}
