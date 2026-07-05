import { env } from '../config/env.js';
import { logger, type Logger } from './foundation/logger.js';
import { createModuleRegistry, type ModuleRegistry } from './foundation/registry.js';
import { createDatabasePool, type DatabasePool } from './infrastructure/database/connection.js';
import { createDatabaseClient, type DatabaseClient } from './infrastructure/database/client.js';
import { runMigrations } from './infrastructure/database/migrator.js';
import { createServiceContainer } from './infrastructure/container.js';

export interface BootContext {
  readonly env: typeof env;
  readonly logger: Logger;
  readonly registry: ModuleRegistry;
  readonly db: DatabaseClient;
  readonly pool: DatabasePool;
}

export async function boot(): Promise<BootContext> {
  const bootLogger = logger.child('bootloader');

  bootLogger.info('Starting Tattvashila Core', {
    nodeEnv: env.nodeEnv,
    logLevel: env.logLevel,
  });

  const pool = createDatabasePool(env.databaseUrl);
  const db = createDatabaseClient(pool);

  bootLogger.info('Database connected');

  await runMigrations(db);

  bootLogger.info('Migrations complete');

  const registry = createModuleRegistry();
  const services = createServiceContainer({ logger }, db);

  await registry.initAll(services);

  bootLogger.info('Tattvashila Core ready');

  return { env, logger, registry, db, pool };
}
