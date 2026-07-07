import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Authorization error codes ───────────────────────────────────────────────
// Domain-level error codes for the authorization application layer.
// Existing codes must not be renamed once callers depend on them.
export const AuthorizationErrorCode = {
  // The authenticated identity does not hold the required permission.
  FORBIDDEN: 'AUTHZ_FORBIDDEN',
} as const;

export type AuthorizationErrorCode =
  (typeof AuthorizationErrorCode)[keyof typeof AuthorizationErrorCode];

// Statuses are keyed by code so each new AuthorizationErrorCode must be
// given an explicit status here — adding a code without a corresponding
// entry is a compile error (TypeScript enforces the Record is total).
const AUTHORIZATION_ERROR_STATUS: Record<AuthorizationErrorCode, number> = {
  [AuthorizationErrorCode.FORBIDDEN]: 403,
};

// ─── AuthorizationError ──────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches authorization
// errors uniformly, while isAuthorizationError() allows narrowing to
// authorization-specific codes.
export class AuthorizationError extends AppError {
  readonly authzCode: AuthorizationErrorCode;

  constructor(message: string, authzCode: AuthorizationErrorCode) {
    super(message, authzCode, AUTHORIZATION_ERROR_STATUS[authzCode]);
    this.name = 'AuthorizationError';
    this.authzCode = authzCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isAuthorizationError(error: unknown): error is AuthorizationError {
  return error instanceof AuthorizationError;
}
