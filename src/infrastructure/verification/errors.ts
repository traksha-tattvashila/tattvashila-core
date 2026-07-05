import { AppError } from '../errors/app-error.js';

// ─── Verification error codes ─────────────────────────────────────────────────
// Stable string codes that identify the category of a verification failure.
// Future sprints may add codes; existing codes must not be renamed once in use.
export const VerificationErrorCode = {
  // The provider could not accept or dispatch the message.
  SEND_FAILED: 'VERIFICATION_SEND_FAILED',

  // The requested contact channel has no registered provider.
  CHANNEL_UNSUPPORTED: 'VERIFICATION_CHANNEL_UNSUPPORTED',
} as const;

export type VerificationErrorCode =
  (typeof VerificationErrorCode)[keyof typeof VerificationErrorCode];

// ─── VerificationError ────────────────────────────────────────────────────────
// Extends AppError so callers can use isAppError() to catch infrastructure
// errors uniformly, while still being able to narrow to VerificationError
// for verification-specific handling.
export class VerificationError extends AppError {
  readonly verificationCode: VerificationErrorCode;

  constructor(
    message: string,
    verificationCode: VerificationErrorCode,
    cause?: unknown,
  ) {
    // Verification errors map to 500 at the HTTP boundary; individual routes
    // may re-map them to 4xx when a future HTTP layer is introduced.
    super(message, verificationCode, 500);
    this.name = 'VerificationError';
    this.verificationCode = verificationCode;
    Object.setPrototypeOf(this, new.target.prototype);

    if (cause instanceof Error && cause.stack) {
      this.stack = `${this.stack}\nCaused by: ${cause.stack}`;
    }
  }
}

export function isVerificationError(error: unknown): error is VerificationError {
  return error instanceof VerificationError;
}
