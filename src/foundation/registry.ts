import type { Logger } from './logger.js';

export interface ModuleServices {
  readonly logger: Logger;
}

export interface Module {
  readonly name: string;
  init(services: ModuleServices): Promise<void>;
}

export interface ModuleRegistry {
  register(module: Module): void;
  initAll(services: ModuleServices): Promise<void>;
}

export function createModuleRegistry(): ModuleRegistry {
  const modules: Module[] = [];
  const registeredNames = new Set<string>();

  function register(module: Module): void {
    if (registeredNames.has(module.name)) {
      throw new Error(`Module already registered: "${module.name}"`);
    }
    registeredNames.add(module.name);
    modules.push(module);
  }

  async function initAll(services: ModuleServices): Promise<void> {
    for (const module of modules) {
      const moduleLogger = services.logger.child(module.name);
      moduleLogger.info('Initializing module');
      await module.init({ ...services, logger: moduleLogger });
      moduleLogger.info('Module ready');
    }
  }

  return { register, initAll };
}
