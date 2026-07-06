import type { NextFunction, Request, Response } from 'express';

import type { Logger } from '../../foundation/logger.js';

// ─── Request logger middleware ────────────────────────────────────────────────
// Logs the HTTP method, URL, response status, and duration on response finish.
// Registered early in the middleware chain so timing covers all subsequent
// processing. Does not log request or response bodies.
export function requestLogger(logger: Logger) {
  const log = logger.child('http');

  return function (req: Request, res: Response, next: NextFunction): void {
    const startedAt = Date.now();

    res.on('finish', () => {
      log.info('Request', {
        method: req.method,
        url: req.originalUrl,
        status: res.statusCode,
        durationMs: Date.now() - startedAt,
      });
    });

    next();
  };
}
