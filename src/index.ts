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
import { createVerificationEngine } from './modules/verification/engine.js';
import { createTrkRepository } from './modules/trk/repository.js';
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

    // ── HTTP server ───────────────────────────────────────────────────────────
    const app = createExpressApp(ctx, {
      orchestrationService,
      identityService,
      transitionService,
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
