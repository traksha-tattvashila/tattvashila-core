import { AppError } from '../../infrastructure/errors/app-error.js';

// ─── Tattvaloka content error codes ─────────────────────────────────────────────
// Domain-level error codes for the Tattvaloka content architecture
// application layer. Existing codes must not be renamed once callers depend
// on them.
export const ContentErrorCode = {
  // No path/module/unit exists for the given identifier.
  PATH_NOT_FOUND: 'TATTVALOKA_CONTENT_PATH_NOT_FOUND',
  MODULE_NOT_FOUND: 'TATTVALOKA_CONTENT_MODULE_NOT_FOUND',
  UNIT_NOT_FOUND: 'TATTVALOKA_CONTENT_UNIT_NOT_FOUND',
  VERSION_NOT_FOUND: 'TATTVALOKA_CONTENT_VERSION_NOT_FOUND',
  // A content key is already in use.
  CONTENT_KEY_ALREADY_EXISTS: 'TATTVALOKA_CONTENT_KEY_ALREADY_EXISTS',
  // A requested status transition is not permitted by the closed
  // constitutional lifecycle (draft → published, draft/published → retired).
  INVALID_STATUS_TRANSITION: 'TATTVALOKA_CONTENT_INVALID_STATUS_TRANSITION',
  // Publishing a unit that has no version yet — there is no substance to
  // publish.
  NO_VERSION_TO_PUBLISH: 'TATTVALOKA_CONTENT_NO_VERSION_TO_PUBLISH',
  // Attempting to create a new version on a retired unit — retired units
  // are permanently resolvable but no longer editable.
  UNIT_RETIRED: 'TATTVALOKA_CONTENT_UNIT_RETIRED',
} as const;

export type ContentErrorCode =
  (typeof ContentErrorCode)[keyof typeof ContentErrorCode];

// Statuses are keyed by code so each new ContentErrorCode must be given an
// explicit status here — adding a code without a corresponding entry is a
// compile error (TypeScript enforces the Record is total).
const CONTENT_ERROR_STATUS: Record<ContentErrorCode, number> = {
  [ContentErrorCode.PATH_NOT_FOUND]: 404,
  [ContentErrorCode.MODULE_NOT_FOUND]: 404,
  [ContentErrorCode.UNIT_NOT_FOUND]: 404,
  [ContentErrorCode.VERSION_NOT_FOUND]: 404,
  [ContentErrorCode.CONTENT_KEY_ALREADY_EXISTS]: 409,
  [ContentErrorCode.INVALID_STATUS_TRANSITION]: 409,
  [ContentErrorCode.NO_VERSION_TO_PUBLISH]: 409,
  [ContentErrorCode.UNIT_RETIRED]: 409,
};

// ─── ContentError ────────────────────────────────────────────────────────────────
// Extends AppError so the existing isAppError() guard catches content errors
// uniformly, while isContentError() allows narrowing to content-specific
// codes.
export class ContentError extends AppError {
  readonly contentCode: ContentErrorCode;

  constructor(message: string, contentCode: ContentErrorCode) {
    super(message, contentCode, CONTENT_ERROR_STATUS[contentCode]);
    this.name = 'ContentError';
    this.contentCode = contentCode;
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export function isContentError(error: unknown): error is ContentError {
  return error instanceof ContentError;
}
