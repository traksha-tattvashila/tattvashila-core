import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Engine error codes ───────────────────────────────────────────────────────
// Domain-level error codes for the verification engine.
// These are separate from Sprint 4A's VerificationErrorCode (transport errors)
// because they describe lifecycle violations, not infrastructure failures.
// Existing codes must not be renamed once callers depend on them.
export const EngineErrorCode = {
  // No live record exists for the given id (absent or expired).
  NOT_FOUND: 'ENGINE_VERIFICATION_NOT_FOUND',

  // The record has already been successfully consumed.
  ALREADY_CONSUMED: 'ENGINE_VERIFICATION_ALREADY_CONSUMED',

  // The submitted OTP did not match the stored hash.
  INVALID_OTP: 'ENGINE_VERIFICATION_INVALID_OTP',

  // The maximum number of failed attempts has been reached; no further
  // attempts are permitted against this record.
  MAX_ATTEMPTS_EXCEEDED: 'ENGINE_VERIFICATION_MAX_ATTEMPTS_EXCEEDED',

  // A resend was requested before the cooldown window has elapsed.
  RESEND_COOLDOWN_ACTIVE: 'ENGINE_VERIFICATION_RESEND_COOLDOWN_ACTIVE',
} as const;

export type EngineErrorCode =
  (typeof EngineErrorCode)[keyof typeof EngineErrorCode];

// ─── EngineError ──────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches engine errors
// uniformly, while isEngineError() allows narrowing to engine-specific codes.
// statusCode is intentionally 400 — these are caller-correctable conditions,
// not server faults. Future HTTP layers may re-map individual codes to 404,
// 409, 429, etc. as appropriate.
export class EngineError extends AppError {
  readonly engineCode: EngineErrorCode;

  constructor(message: string, engineCode: EngineErrorCode) {
    super(message, engineCode, 400);
    this.name = 'EngineError';
    this.engineCode = engineCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isEngineError(error: unknown): error is EngineError {
  return error instanceof EngineError;
}
