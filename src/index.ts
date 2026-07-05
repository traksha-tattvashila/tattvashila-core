import { boot } from './bootloader.js';
import { logger } from './foundation/logger.js';

boot().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  const stack = error instanceof Error ? error.stack : undefined;

  logger.error('Fatal startup failure', { message, stack });
  process.exit(1);
});
