import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Profile error codes ──────────────────────────────────────────────────────
// Domain-level error codes for the profile application layer.
// Existing codes must not be renamed once callers depend on them.
export const ProfileErrorCode = {
  // No profile exists for the given constitutional identity.
  NOT_FOUND: 'PROFILE_NOT_FOUND',
  // A profile already exists for the given constitutional identity.
  ALREADY_EXISTS: 'PROFILE_ALREADY_EXISTS',
} as const;

export type ProfileErrorCode =
  (typeof ProfileErrorCode)[keyof typeof ProfileErrorCode];

// Statuses are keyed by code so each new ProfileErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const PROFILE_ERROR_STATUS: Record<ProfileErrorCode, number> = {
  [ProfileErrorCode.NOT_FOUND]: 404,
  [ProfileErrorCode.ALREADY_EXISTS]: 409,
};

// ─── ProfileError ─────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches profile errors
// uniformly, while isProfileError() allows narrowing to profile-specific codes.
export class ProfileError extends AppError {
  readonly profileCode: ProfileErrorCode;

  constructor(message: string, profileCode: ProfileErrorCode) {
    super(message, profileCode, PROFILE_ERROR_STATUS[profileCode]);
    this.name = 'ProfileError';
    this.profileCode = profileCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isProfileError(error: unknown): error is ProfileError {
  return error instanceof ProfileError;
}
