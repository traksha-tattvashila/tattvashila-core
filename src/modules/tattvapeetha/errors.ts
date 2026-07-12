import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Tattvapeetha error codes ───────────────────────────────────────────────────
// Domain-level error codes for the Tattvapeetha application layer.
// Existing codes must not be renamed once callers depend on them.
export const TattvapeethaErrorCode = {
  // No Tattvapeetha entity exists for the given owning institution.
  NOT_FOUND: 'TATTVAPEETHA_ENTITY_NOT_FOUND',
  // A Tattvapeetha entity already exists for the given owning institution.
  ALREADY_EXISTS: 'TATTVAPEETHA_ENTITY_ALREADY_EXISTS',
} as const;

export type TattvapeethaErrorCode =
  (typeof TattvapeethaErrorCode)[keyof typeof TattvapeethaErrorCode];

// Statuses are keyed by code so each new TattvapeethaErrorCode must be given
// an explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const TATTVAPEETHA_ERROR_STATUS: Record<TattvapeethaErrorCode, number> = {
  [TattvapeethaErrorCode.NOT_FOUND]: 404,
  [TattvapeethaErrorCode.ALREADY_EXISTS]: 409,
};

// ─── TattvapeethaError ───────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches Tattvapeetha
// errors uniformly, while isTattvapeethaError() allows narrowing to
// Tattvapeetha-specific codes.
export class TattvapeethaError extends AppError {
  readonly tattvapeethaCode: TattvapeethaErrorCode;

  constructor(message: string, tattvapeethaCode: TattvapeethaErrorCode) {
    super(message, tattvapeethaCode, TATTVAPEETHA_ERROR_STATUS[tattvapeethaCode]);
    this.name = 'TattvapeethaError';
    this.tattvapeethaCode = tattvapeethaCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isTattvapeethaError(error: unknown): error is TattvapeethaError {
  return error instanceof TattvapeethaError;
}
