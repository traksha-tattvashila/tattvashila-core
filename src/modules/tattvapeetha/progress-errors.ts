import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Tattvapeetha progress error codes ──────────────────────────────────────────
// Domain-level error codes for the Tattvapeetha progress & completion tracking
// application layer. Existing codes must not be renamed once callers depend
// on them.
export const ProgressErrorCode = {
  // The requested status transition is not permitted (e.g. regressing out
  // of "completed", which is terminal).
  INVALID_TRANSITION: 'TATTVALOKA_PROGRESS_INVALID_TRANSITION',
  // The referenced content unit is not published, so progress cannot be
  // started or completed against it (draft units are not yet member-facing;
  // retired units no longer accept new engagement, though existing records
  // remain readable).
  UNIT_NOT_TRACKABLE: 'TATTVALOKA_PROGRESS_UNIT_NOT_TRACKABLE',
} as const;

export type ProgressErrorCode =
  (typeof ProgressErrorCode)[keyof typeof ProgressErrorCode];

// Statuses are keyed by code so each new ProgressErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const PROGRESS_ERROR_STATUS: Record<ProgressErrorCode, number> = {
  [ProgressErrorCode.INVALID_TRANSITION]: 409,
  [ProgressErrorCode.UNIT_NOT_TRACKABLE]: 409,
};

// ─── ProgressError ────────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches progress
// errors uniformly, while isProgressError() allows narrowing to
// progress-specific codes.
export class ProgressError extends AppError {
  readonly progressCode: ProgressErrorCode;

  constructor(message: string, progressCode: ProgressErrorCode) {
    super(message, progressCode, PROGRESS_ERROR_STATUS[progressCode]);
    this.name = 'ProgressError';
    this.progressCode = progressCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isProgressError(error: unknown): error is ProgressError {
  return error instanceof ProgressError;
}
