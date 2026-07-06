import { env } from '../config/env.js';
import { boot } from './bootloader.js';
import { logger } from './foundation/logger.js';
import { createInMemoryVerificationCache } from './infrastructure/verification/cache/in-memory-cache.js';
import { createVerificationInfrastructure } from './infrastructure/verification/container.js';
import { createDevEmailProvider } from './infrastructure/verification/providers/dev-email-provider.js';
import { createDevSmsProvider } from './infrastructure/verification/providers/dev-sms-provider.js';
import type { EmailProvider } from './infrastructure/verification/providers/email-provider.js';
import type { SmsProvider } from './infrastructure/verification/providers/sms-provider.js';
import { createVerificationProvider } from './infrastructure/verification/providers/verification-provider.js';
import { createRecordLock } from './infrastructure/concurrency/record-lock.js';
import { createExpressApp } from './http/server.js';
import { createVerificationEngine } from './modules/verification/engine.js';
import { createTrkRepository } from './modules/trk/repository.js';
import {
  createDualVerificationSessionStore,
} from './modules/verification/orchestration/session.js';
import { createVerificationOrchestrationService } from './modules/verification/orchestration/orchestration-service.js';

const PORT = parseInt(process.env['PORT'] ?? '5000', 10);

// ── Provider resolution ───────────────────────────────────────────────────────
// Dev providers log OTPs to stdout and must never run in production.
// Production requires real SMS/email providers injected here before deployment.
// The process exits at startup rather than silently degrading.
function resolveProviders(ctx: { logger: ReturnType<typeof logger.child> }): {
  smsProvider: SmsProvider;
  emailProvider: EmailProvider;
} {
  if (env.nodeEnv === 'production') {
    // Real providers are not yet implemented (Sprint 5 architectural concern).
    // Remove this guard and inject concrete providers when they are available.
    logger.error(
      'Production SMS/email providers are not configured. ' +
      'Register real SmsProvider and EmailProvider implementations before deploying.',
    );
    process.exit(1);
  }

  return {
    smsProvider: createDevSmsProvider(ctx.logger),
    emailProvider: createDevEmailProvider(ctx.logger),
  };
}

boot()
  .then((ctx) => {
    // ── Verification infrastructure (Sprint 4A) ──────────────────────────────
    const verificationCache = createInMemoryVerificationCache();
    const { smsProvider, emailProvider } = resolveProviders({
      logger: ctx.logger.child('providers'),
    });
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

    // ── HTTP server ───────────────────────────────────────────────────────────
    const app = createExpressApp(ctx, { orchestrationService });

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
