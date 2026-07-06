import express, { type Express } from 'express';

import type { BootContext } from '../bootloader.js';
import { errorHandler } from './middleware/error-handler.js';
import { requestLogger } from './middleware/request-logger.js';
import { registerRoutes, type AppDependencies } from './routes/index.js';

// ─── Express application factory ─────────────────────────────────────────────
// Assembles and returns a fully configured Express application.
// Middleware is ordered deliberately:
//   1. JSON body parsing — must precede route handlers.
//   2. Request logger — measures total handler duration.
//   3. Routes — all application endpoints.
//   4. Error handler — must be last; receives errors forwarded via next(err).
//
// Listening is the caller's responsibility (src/index.ts) so that the
// port and server lifecycle remain outside this factory.
export function createExpressApp(ctx: BootContext, deps: AppDependencies): Express {
  const app = express();

  app.use(express.json());
  app.use(requestLogger(ctx.logger));

  registerRoutes(app, deps);

  app.use(errorHandler(ctx.logger));

  return app;
}
