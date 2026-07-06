import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Auth error codes ────────────────────────────────────────────────────────
// Domain-level error codes for the authentication application layer.
// Existing codes must not be renamed once callers depend on them.
export const AuthErrorCode = {
  // Login failed: unknown contact, no credential set, or wrong password.
  // Deliberately a single code for all three cases so responses never leak
  // which part of the check failed.
  INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  // A password credential already exists for this identity.
  CREDENTIAL_ALREADY_EXISTS: 'AUTH_CREDENTIAL_ALREADY_EXISTS',
  // Candidate password fails the configured password policy.
  WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
  // Refresh token is missing, unknown, expired, or already revoked.
  REFRESH_TOKEN_INVALID: 'AUTH_REFRESH_TOKEN_INVALID',
  // Access token is missing, malformed, expired, or fails signature verification.
  ACCESS_TOKEN_INVALID: 'AUTH_ACCESS_TOKEN_INVALID',
} as const;

export type AuthErrorCode = (typeof AuthErrorCode)[keyof typeof AuthErrorCode];

// Statuses are keyed by code so each new AuthErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const AUTH_ERROR_STATUS: Record<AuthErrorCode, number> = {
  [AuthErrorCode.INVALID_CREDENTIALS]: 401,
  [AuthErrorCode.CREDENTIAL_ALREADY_EXISTS]: 409,
  [AuthErrorCode.WEAK_PASSWORD]: 422,
  [AuthErrorCode.REFRESH_TOKEN_INVALID]: 401,
  [AuthErrorCode.ACCESS_TOKEN_INVALID]: 401,
};

// ─── AuthError ────────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches auth errors
// uniformly, while isAuthError() allows narrowing to auth-specific codes.
export class AuthError extends AppError {
  readonly authCode: AuthErrorCode;

  constructor(message: string, authCode: AuthErrorCode) {
    super(message, authCode, AUTH_ERROR_STATUS[authCode]);
    this.name = 'AuthError';
    this.authCode = authCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isAuthError(error: unknown): error is AuthError {
  return error instanceof AuthError;
}
