import type { Express } from 'express';

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
}
