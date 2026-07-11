import { env } from '../config/env.js';
import { boot } from './bootloader.js';
import { logger } from './foundation/logger.js';
import { createInMemoryVerificationCache } from './infrastructure/verification/cache/in-memory-cache.js';
import { createVerificationInfrastructure } from './infrastructure/verification/container.js';
import { validateProviderHealth } from './infrastructure/verification/providers/health.js';
import {
  createEmailProvider,
  createSmsProvider,
} from './infrastructure/verification/providers/provider-factory.js';
import { createVerificationProvider } from './infrastructure/verification/providers/verification-provider.js';
import { createRecordLock } from './infrastructure/concurrency/record-lock.js';
import { createExpressApp } from './http/server.js';
import { loadAuthConfig } from './modules/auth/config.js';
import { createAuthRepository } from './modules/auth/repository.js';
import { createAuthService } from './modules/auth/service.js';
import { createAuthorizationRepository } from './modules/authorization/repository.js';
import { createAuthorizationService } from './modules/authorization/service.js';
import { createProfileRepository } from './modules/profile/repository.js';
import { createProfileService } from './modules/profile/service.js';
import { createVerificationEngine } from './modules/verification/engine.js';
import { createTrkRepository } from './modules/trk/repository.js';
import { createInstitutionRepository } from './modules/ins/repository.js';
import { createInstitutionService } from './modules/ins/service.js';
import { createTattvalokaRepository } from './modules/tattvaloka/repository.js';
import { createTattvalokaService } from './modules/tattvaloka/service.js';
import { createMembershipRepository } from './modules/tattvaloka/membership-repository.js';
import { createMembershipService } from './modules/tattvaloka/membership-service.js';
import { createContentRepository } from './modules/tattvaloka/content-repository.js';
import { createContentService } from './modules/tattvaloka/content-service.js';
import { createIdentityDiscoveryService } from './modules/trk/discovery-service.js';
import { createIdentityService } from './modules/trk/service.js';
import { createTrkTransitionService } from './modules/trk/transition-service.js';
import {
  createDualVerificationSessionStore,
} from './modules/verification/orchestration/session.js';
import { createVerificationOrchestrationService } from './modules/verification/orchestration/orchestration-service.js';

const PORT = parseInt(process.env['PORT'] ?? '5000', 10);

boot()
  .then(async (ctx) => {
    // ── Verification infrastructure (Sprint 4A / Sprint 8 providers) ─────────
    const providerLogger = ctx.logger.child('providers');
    const verificationCache = createInMemoryVerificationCache();
    const smsProvider = createSmsProvider(env.nodeEnv, providerLogger);
    const emailProvider = createEmailProvider(env.nodeEnv, providerLogger);

    // Fail startup fast if the configured providers cannot actually be
    // reached — never accept traffic against a broken messaging channel.
    await validateProviderHealth({ sms: smsProvider, email: emailProvider }, providerLogger);

    const verificationProvider = createVerificationProvider(smsProvider, emailProvider);
    const verificationInfra = createVerificationInfrastructure(
      verificationCache,
      verificationProvider,
    );

    // ── Verification engine (Sprint 4B) ──────────────────────────────────────
    const engine = createVerificationEngine(verificationInfra);

    // ── Sprint 5 services ────────────────────────────────────────────────────
    const sessionStore = createDualVerificationSessionStore();
    const trkRepository = createTrkRepository(ctx.db);
    const sessionLock = createRecordLock();

    const orchestrationService = createVerificationOrchestrationService({
      engine,
      sessionStore,
      trkRepository,
      sessionLock,
      logger: ctx.logger.child('orchestration'),
    });

    // ── Sprint 6 services ────────────────────────────────────────────────────
    const identityService = createIdentityService(trkRepository);

    // ── Sprint 7 services ────────────────────────────────────────────────────
    const transitionService = createTrkTransitionService(trkRepository);

    // ── Sprint 13 services (Constitutional Identity Discovery) ────────────────
    const discoveryService = createIdentityDiscoveryService(trkRepository);

    // ── Sprint 14 services (Constitutional Institution Identity) ──────────────
    const institutionRepository = createInstitutionRepository(ctx.db);
    const institutionService = createInstitutionService(institutionRepository);

    // ── Sprint 9 services (Authentication Infrastructure) ────────────────────
    const authConfig = loadAuthConfig();
    const authRepository = createAuthRepository(ctx.db);
    const authService = createAuthService({
      repository: authRepository,
      identityService,
      config: authConfig,
    });

    // ── Sprint 10 services (Authorization Foundation) ─────────────────────────
    const authorizationRepository = createAuthorizationRepository(ctx.db);
    const authorizationService = createAuthorizationService(authorizationRepository);

    // ── Sprint 11 services (Identity Profile Foundation) ──────────────────────
    const profileRepository = createProfileRepository(ctx.db);
    const profileService = createProfileService(profileRepository);

    // ── Sprint 15 services (Constitutional Tattvaloka Foundation) ─────────────
    const tattvalokaRepository = createTattvalokaRepository(ctx.db);
    const tattvalokaService = createTattvalokaService(tattvalokaRepository);

    // ── Sprint 16 services (Tattvaloka Membership Foundation) ─────────────────
    const membershipRepository = createMembershipRepository(ctx.db);
    const membershipService = createMembershipService(membershipRepository, tattvalokaService);

    // ── Sprint 17 services (Tattvaloka Content Architecture) ──────────────────
    const contentRepository = createContentRepository(ctx.db);
    const contentService = createContentService(contentRepository);

    // ── HTTP server ───────────────────────────────────────────────────────────
    const app = createExpressApp(ctx, {
      orchestrationService,
      identityService,
      transitionService,
      discoveryService,
      institutionService,
      authService,
      authorizationService,
      profileService,
      tattvalokaService,
      membershipService,
      contentService,
    });

    const server = app.listen(PORT, '0.0.0.0', () => {
      ctx.logger.info('HTTP server listening', { port: PORT });
    });

    server.on('error', (error: Error) => {
      ctx.logger.error('HTTP server error', { message: error.message, stack: error.stack });
      process.exit(1);
    });
  })
  .catch((error: unknown) => {
    const message = error instanceof Error ? error.message : String(error);
    const stack = error instanceof Error ? error.stack : undefined;
    logger.error('Fatal startup failure', { message, stack });
    process.exit(1);
  });
