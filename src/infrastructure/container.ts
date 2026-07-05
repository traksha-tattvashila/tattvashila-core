import type { ModuleServices } from '../foundation/registry.js';
import type { DatabaseClient } from './database/client.js';

export interface ServiceContainer extends ModuleServices {
  readonly db: DatabaseClient;
}

export function createServiceContainer(
  services: ModuleServices,
  db: DatabaseClient,
): ServiceContainer {
  return Object.freeze({ ...services, db });
}
