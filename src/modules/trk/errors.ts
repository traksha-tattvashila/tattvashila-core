import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Identity error codes ──────────────────────────────────────────────────────
// Domain-level error codes for the identity application layer.
// Existing codes must not be renamed once callers depend on them.
export const IdentityErrorCode = {
  // No identity exists for the given UUID or verified contact.
  NOT_FOUND: 'IDENTITY_NOT_FOUND',
  // The identity has already transitioned to TRK; a second transition
  // attempt is rejected without modifying the database (Sprint 7).
  ALREADY_TRK: 'IDENTITY_ALREADY_TRK',
  // TRK eligibility: phone number has not been verified for this identity.
  PHONE_NOT_VERIFIED: 'IDENTITY_PHONE_NOT_VERIFIED',
  // TRK eligibility: email address has not been verified for this identity.
  EMAIL_NOT_VERIFIED: 'IDENTITY_EMAIL_NOT_VERIFIED',
  // TRK eligibility: the minimum waiting period as TMP has not yet elapsed.
  WAITING_PERIOD_NOT_COMPLETE: 'IDENTITY_WAITING_PERIOD_NOT_COMPLETE',
} as const;

export type IdentityErrorCode =
  (typeof IdentityErrorCode)[keyof typeof IdentityErrorCode];

// Statuses are keyed by code so each new IdentityErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const IDENTITY_ERROR_STATUS: Record<IdentityErrorCode, number> = {
  [IdentityErrorCode.NOT_FOUND]: 404,
  [IdentityErrorCode.ALREADY_TRK]: 409,
  [IdentityErrorCode.PHONE_NOT_VERIFIED]: 422,
  [IdentityErrorCode.EMAIL_NOT_VERIFIED]: 422,
  [IdentityErrorCode.WAITING_PERIOD_NOT_COMPLETE]: 422,
};

// ─── IdentityError ──────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches identity errors
// uniformly, while isIdentityError() allows narrowing to identity-specific codes.
export class IdentityError extends AppError {
  readonly identityCode: IdentityErrorCode;

  constructor(message: string, identityCode: IdentityErrorCode) {
    super(message, identityCode, IDENTITY_ERROR_STATUS[identityCode]);
    this.name = 'IdentityError';
    this.identityCode = identityCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isIdentityError(error: unknown): error is IdentityError {
  return error instanceof IdentityError;
}
