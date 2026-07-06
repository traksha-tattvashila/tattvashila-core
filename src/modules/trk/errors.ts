import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Identity error codes ──────────────────────────────────────────────────────
// Domain-level error codes for the identity application layer.
// Existing codes must not be renamed once callers depend on them.
export const IdentityErrorCode = {
  // No identity exists for the given UUID or verified contact.
  NOT_FOUND: 'IDENTITY_NOT_FOUND',
} as const;

export type IdentityErrorCode =
  (typeof IdentityErrorCode)[keyof typeof IdentityErrorCode];

// ─── IdentityError ──────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches identity errors
// uniformly, while isIdentityError() allows narrowing to identity-specific codes.
export class IdentityError extends AppError {
  readonly identityCode: IdentityErrorCode;

  constructor(message: string, identityCode: IdentityErrorCode) {
    super(message, identityCode, 404);
    this.name = 'IdentityError';
    this.identityCode = identityCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isIdentityError(error: unknown): error is IdentityError {
  return error instanceof IdentityError;
}
