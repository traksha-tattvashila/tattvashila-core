import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Tattvaloka error codes ────────────────────────────────────────────────────
// Domain-level error codes for the Tattvaloka application layer.
// Existing codes must not be renamed once callers depend on them.
export const TattvalokaErrorCode = {
  // No participant record exists for the given constitutional identity.
  NOT_FOUND: 'TATTVALOKA_PARTICIPANT_NOT_FOUND',
  // A participant record already exists for the given constitutional identity.
  ALREADY_EXISTS: 'TATTVALOKA_PARTICIPANT_ALREADY_EXISTS',
} as const;

export type TattvalokaErrorCode =
  (typeof TattvalokaErrorCode)[keyof typeof TattvalokaErrorCode];

// Statuses are keyed by code so each new TattvalokaErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const TATTVALOKA_ERROR_STATUS: Record<TattvalokaErrorCode, number> = {
  [TattvalokaErrorCode.NOT_FOUND]: 404,
  [TattvalokaErrorCode.ALREADY_EXISTS]: 409,
};

// ─── TattvalokaError ────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches Tattvaloka
// errors uniformly, while isTattvalokaError() allows narrowing to
// Tattvaloka-specific codes.
export class TattvalokaError extends AppError {
  readonly tattvalokaCode: TattvalokaErrorCode;

  constructor(message: string, tattvalokaCode: TattvalokaErrorCode) {
    super(message, tattvalokaCode, TATTVALOKA_ERROR_STATUS[tattvalokaCode]);
    this.name = 'TattvalokaError';
    this.tattvalokaCode = tattvalokaCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isTattvalokaError(error: unknown): error is TattvalokaError {
  return error instanceof TattvalokaError;
}
