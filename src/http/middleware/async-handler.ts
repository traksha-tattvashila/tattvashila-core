import type { RequestHandler } from 'express';

// ─── Async Express handler wrapper ───────────────────────────────────────────
// Express 4 does not natively forward Promise rejections from async route
// handlers to the error-handler middleware. This wrapper catches any rejection
// and forwards it via next(), keeping error handling centralised.
export function asyncHandler(
  handler: (...args: Parameters<RequestHandler>) => Promise<void>,
): RequestHandler {
  return (req, res, next): void => {
    handler(req, res, next).catch(next);
  };
}
