import type { Express } from 'express';

import { createAuthRouter } from '../../modules/auth/http/routes.js';
import { createAuthMiddleware } from '../../modules/auth/http/middleware.js';
import type { AuthService } from '../../modules/auth/service.js';
import { createAuthorizationRouter } from '../../modules/authorization/http/routes.js';
import type { AuthorizationService } from '../../modules/authorization/service.js';
import type { IdentityService } from '../../modules/trk/service.js';
import { createIdentityRouter } from '../../modules/trk/http/routes.js';
import { createTrkTransitionRouter } from '../../modules/trk/http/transition-routes.js';
import type { TrkTransitionService } from '../../modules/trk/transition-service.js';
import type { VerificationOrchestrationService } from '../../modules/verification/orchestration/orchestration-service.js';
import { createVerificationRouter } from '../../modules/verification/http/routes.js';

// ─── Application dependencies ─────────────────────────────────────────────────
// All services required to register routes are declared here so that
// createExpressApp receives a single typed object rather than growing its
// parameter list with each new route module.
export interface AppDependencies {
  readonly orchestrationService: VerificationOrchestrationService;
  readonly identityService: IdentityService;
  readonly transitionService: TrkTransitionService;
  readonly authService: AuthService;
  readonly authorizationService: AuthorizationService;
}

// ─── Route registration ───────────────────────────────────────────────────────
// Mounts all route modules under their canonical prefixes.
// New route modules are added here and nowhere else.
export function registerRoutes(app: Express, deps: AppDependencies): void {
  app.use(
    '/verifications',
    createVerificationRouter(deps.orchestrationService),
  );

  app.use('/identities', createIdentityRouter(deps.identityService));
  app.use('/identities', createTrkTransitionRouter(deps.transitionService));
  app.use('/auth', createAuthRouter(deps.authService, deps.identityService));
  app.use(
    '/authorization',
    createAuthorizationRouter(
      createAuthMiddleware(deps.authService),
      deps.authorizationService,
    ),
  );
}
