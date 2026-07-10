import type { NextFunction, Request, Response } from 'express';

import type { Logger } from '../../foundation/logger.js';
import { isAppError } from '../../infrastructure/errors/app-error.js';
import { AuthErrorCode, isAuthError } from '../../modules/auth/errors.js';
import { AuthorizationErrorCode, isAuthorizationError } from '../../modules/authorization/errors.js';
import { ProfileErrorCode, isProfileError } from '../../modules/profile/errors.js';
import { InstitutionErrorCode, isInstitutionError } from '../../modules/ins/errors.js';
import { TattvalokaErrorCode, isTattvalokaError } from '../../modules/tattvaloka/errors.js';
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

// ─── Institution error → HTTP status mapping ──────────────────────────────────
function httpStatusForInstitutionCode(code: InstitutionErrorCode): number {
  switch (code) {
    case InstitutionErrorCode.NOT_FOUND:
      return 404;
    default: {
      const _: never = code;
      void _;
      return 404;
    }
  }
}

// ─── Identity error → HTTP status mapping ────────────────────────────────────
// IdentityError already carries the correct statusCode (set at construction
// from IDENTITY_ERROR_STATUS) for every code, so this switch is redundant
// with that lookup by design — it exists purely to keep the mapping style
// consistent with EngineError and to force a compile error if a new
// IdentityErrorCode is added without an explicit status decision here.
function httpStatusForIdentityCode(code: IdentityErrorCode): number {
  switch (code) {
    case IdentityErrorCode.NOT_FOUND:
      return 404;
    case IdentityErrorCode.ALREADY_TRK:
      return 409;
    default: {
      // Exhaustiveness guard — new codes must be mapped above.
      const _: never = code;
      void _;
      return 404;
    }
  }
}

// ─── Auth error → HTTP status mapping ────────────────────────────────────────
// AuthError already carries the correct statusCode (set at construction from
// AUTH_ERROR_STATUS) for every code, so this switch is redundant with that
// lookup by design — it exists purely to keep the mapping style consistent
// with EngineError/IdentityError and to force a compile error if a new
// AuthErrorCode is added without an explicit status decision here.
function httpStatusForAuthCode(code: AuthErrorCode): number {
  switch (code) {
    case AuthErrorCode.INVALID_CREDENTIALS:
      return 401;
    case AuthErrorCode.CREDENTIAL_ALREADY_EXISTS:
      return 409;
    case AuthErrorCode.WEAK_PASSWORD:
      return 422;
    case AuthErrorCode.REFRESH_TOKEN_INVALID:
      return 401;
    case AuthErrorCode.ACCESS_TOKEN_INVALID:
      return 401;
    default: {
      // Exhaustiveness guard — new codes must be mapped above.
      const _: never = code;
      void _;
      return 401;
    }
  }
}

// ─── Authorization error → HTTP status mapping ───────────────────────────────
function httpStatusForAuthorizationCode(code: AuthorizationErrorCode): number {
  switch (code) {
    case AuthorizationErrorCode.FORBIDDEN:
      return 403;
    default: {
      const _: never = code;
      void _;
      return 403;
    }
  }
}

// ─── Profile error → HTTP status mapping ─────────────────────────────────────
function httpStatusForProfileCode(code: ProfileErrorCode): number {
  switch (code) {
    case ProfileErrorCode.NOT_FOUND:
      return 404;
    case ProfileErrorCode.ALREADY_EXISTS:
      return 409;
    default: {
      const _: never = code;
      void _;
      return 400;
    }
  }
}

// ─── Tattvaloka error → HTTP status mapping ───────────────────────────────────
function httpStatusForTattvalokaCode(code: TattvalokaErrorCode): number {
  switch (code) {
    case TattvalokaErrorCode.NOT_FOUND:
      return 404;
    case TattvalokaErrorCode.ALREADY_EXISTS:
      return 409;
    default: {
      const _: never = code;
      void _;
      return 400;
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

    if (isInstitutionError(err)) {
      const status = httpStatusForInstitutionCode(err.institutionCode);
      res.status(status).json({ error: { code: err.institutionCode, message: err.message } });
      return;
    }

    if (isIdentityError(err)) {
      const status = httpStatusForIdentityCode(err.identityCode);
      res.status(status).json({ error: { code: err.identityCode, message: err.message } });
      return;
    }

    if (isAuthError(err)) {
      const status = httpStatusForAuthCode(err.authCode);
      res.status(status).json({ error: { code: err.authCode, message: err.message } });
      return;
    }

    if (isAuthorizationError(err)) {
      const status = httpStatusForAuthorizationCode(err.authzCode);
      res.status(status).json({ error: { code: err.authzCode, message: err.message } });
      return;
    }

    if (isProfileError(err)) {
      const status = httpStatusForProfileCode(err.profileCode);
      res.status(status).json({ error: { code: err.profileCode, message: err.message } });
      return;
    }

    if (isTattvalokaError(err)) {
      const status = httpStatusForTattvalokaCode(err.tattvalokaCode);
      res.status(status).json({ error: { code: err.tattvalokaCode, message: err.message } });
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
