import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Institution error codes ──────────────────────────────────────────────────
// Domain-level error codes for the institution application layer.
// Existing codes must not be renamed once callers depend on them.
export const InstitutionErrorCode = {
  // No institution exists for the given UUID or INS identifier.
  NOT_FOUND: 'INSTITUTION_NOT_FOUND',
} as const;

export type InstitutionErrorCode =
  (typeof InstitutionErrorCode)[keyof typeof InstitutionErrorCode];

// Statuses are keyed by code so each new InstitutionErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const INSTITUTION_ERROR_STATUS: Record<InstitutionErrorCode, number> = {
  [InstitutionErrorCode.NOT_FOUND]: 404,
};

// ─── InstitutionError ─────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches institution
// errors uniformly, while isInstitutionError() allows narrowing to
// institution-specific codes.
export class InstitutionError extends AppError {
  readonly institutionCode: InstitutionErrorCode;

  constructor(message: string, institutionCode: InstitutionErrorCode) {
    super(message, institutionCode, INSTITUTION_ERROR_STATUS[institutionCode]);
    this.name = 'InstitutionError';
    this.institutionCode = institutionCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isInstitutionError(error: unknown): error is InstitutionError {
  return error instanceof InstitutionError;
}
