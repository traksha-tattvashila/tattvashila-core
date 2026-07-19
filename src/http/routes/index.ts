import type { Express } from 'express';

import { createAuthRouter } from '../../modules/auth/http/routes.js';
import { createAuthMiddleware } from '../../modules/auth/http/middleware.js';
import type { AuthService } from '../../modules/auth/service.js';
import { createAuthorizationRouter } from '../../modules/authorization/http/routes.js';
import type { AuthorizationService } from '../../modules/authorization/service.js';
import { createProfileRouter } from '../../modules/profile/http/routes.js';
import type { ProfileService } from '../../modules/profile/service.js';
import type { InstitutionService } from '../../modules/ins/service.js';
import { createInstitutionRouter } from '../../modules/ins/http/routes.js';
import type { TattvalokaService } from '../../modules/tattvaloka/service.js';
import { createTattvalokaRouter } from '../../modules/tattvaloka/http/routes.js';
import type { MembershipService } from '../../modules/tattvaloka/membership-service.js';
import { createMembershipRouter } from '../../modules/tattvaloka/http/membership-routes.js';
import type { ContentService } from '../../modules/tattvapeetha/content-service.js';
import { createContentRouter } from '../../modules/tattvapeetha/http/content-routes.js';
import type { ProgressService } from '../../modules/tattvapeetha/progress-service.js';
import { createProgressRouter } from '../../modules/tattvapeetha/http/progress-routes.js';
import type { DiscoveryService as TattvapeethaDiscoveryService } from '../../modules/tattvapeetha/discovery-service.js';
import { createDiscoveryRouter as createTattvapeethaDiscoveryRouter } from '../../modules/tattvapeetha/http/discovery-routes.js';
import type { TattvapeethaService } from '../../modules/tattvapeetha/service.js';
import { createTattvapeethaRouter } from '../../modules/tattvapeetha/http/routes.js';
import type { IdentityDiscoveryService } from '../../modules/trk/discovery-service.js';
import { createIdentityDiscoveryRouter } from '../../modules/trk/http/discovery-routes.js';
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
  readonly discoveryService: IdentityDiscoveryService;
  readonly institutionService: InstitutionService;
  readonly authService: AuthService;
  readonly authorizationService: AuthorizationService;
  readonly profileService: ProfileService;
  readonly tattvalokaService: TattvalokaService;
  readonly membershipService: MembershipService;
  readonly contentService: ContentService;
  readonly progressService: ProgressService;
  readonly tattvapeethaDiscoveryService: TattvapeethaDiscoveryService;
  readonly tattvapeethaService: TattvapeethaService;
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
  app.use(
    '/identities',
    createTrkTransitionRouter(
      createAuthMiddleware(deps.authService),
      deps.transitionService,
    ),
  );
  app.use('/identities', createIdentityDiscoveryRouter(deps.discoveryService));
  app.use('/institutions', createInstitutionRouter(deps.institutionService));
  app.use('/auth', createAuthRouter(deps.authService, deps.identityService));
  app.use(
    '/authorization',
    createAuthorizationRouter(
      createAuthMiddleware(deps.authService),
      deps.authorizationService,
    ),
  );
  app.use(
    '/profile',
    createProfileRouter(
      createAuthMiddleware(deps.authService),
      deps.profileService,
    ),
  );
  app.use(
    '/tattvaloka',
    createTattvalokaRouter(
      createAuthMiddleware(deps.authService),
      deps.tattvalokaService,
    ),
  );
  app.use(
    '/tattvaloka',
    createMembershipRouter(
      createAuthMiddleware(deps.authService),
      deps.membershipService,
    ),
  );
  app.use('/tattvapeetha', createContentRouter(deps.contentService));
  app.use(
    '/tattvapeetha',
    createProgressRouter(
      createAuthMiddleware(deps.authService),
      deps.progressService,
    ),
  );
  app.use(
    '/tattvapeetha',
    createTattvapeethaDiscoveryRouter(deps.tattvapeethaDiscoveryService),
  );
  app.use('/', createTattvapeethaRouter(deps.tattvapeethaService));
}
