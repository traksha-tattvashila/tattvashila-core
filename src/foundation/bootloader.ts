import { env } from '../../config/env.js';
import { logger, type Logger } from './logger.js';
import { createModuleRegistry, type ModuleRegistry } from './registry.js';

export interface BootContext {
  readonly env: typeof env;
  readonly logger: Logger;
  readonly registry: ModuleRegistry;
}

export async function boot(): Promise<BootContext> {
  const bootLogger = logger.child('bootloader');

  bootLogger.info('Starting Tattvashila Core', {
    nodeEnv: env.nodeEnv,
    logLevel: env.logLevel,
  });

  const registry = createModuleRegistry();

  await registry.initAll(logger);

  bootLogger.info('Tattvashila Core ready');

  return { env, logger, registry };
}
