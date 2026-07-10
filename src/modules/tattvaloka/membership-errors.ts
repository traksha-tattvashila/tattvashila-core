import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Tattvaloka membership error codes ─────────────────────────────────────────
// Domain-level error codes for the Tattvaloka membership application layer.
// Existing codes must not be renamed once callers depend on them.
export const MembershipErrorCode = {
  // No membership record exists for the given constitutional identity.
  NOT_FOUND: 'TATTVALOKA_MEMBERSHIP_NOT_FOUND',
  // A membership record already exists for the given constitutional identity.
  ALREADY_EXISTS: 'TATTVALOKA_MEMBERSHIP_ALREADY_EXISTS',
} as const;

export type MembershipErrorCode =
  (typeof MembershipErrorCode)[keyof typeof MembershipErrorCode];

// Statuses are keyed by code so each new MembershipErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const MEMBERSHIP_ERROR_STATUS: Record<MembershipErrorCode, number> = {
  [MembershipErrorCode.NOT_FOUND]: 404,
  [MembershipErrorCode.ALREADY_EXISTS]: 409,
};

// ─── MembershipError ─────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches membership
// errors uniformly, while isMembershipError() allows narrowing to
// membership-specific codes.
export class MembershipError extends AppError {
  readonly membershipCode: MembershipErrorCode;

  constructor(message: string, membershipCode: MembershipErrorCode) {
    super(message, membershipCode, MEMBERSHIP_ERROR_STATUS[membershipCode]);
    this.name = 'MembershipError';
    this.membershipCode = membershipCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isMembershipError(error: unknown): error is MembershipError {
  return error instanceof MembershipError;
}
