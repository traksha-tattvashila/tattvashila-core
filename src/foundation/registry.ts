import type { Logger } from './logger.js';

export interface Module {
  readonly name: string;
  init(logger: Logger): Promise<void>;
}

export interface ModuleRegistry {
  register(module: Module): void;
  initAll(logger: Logger): Promise<void>;
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

  async function initAll(logger: Logger): Promise<void> {
    for (const module of modules) {
      const moduleLogger = logger.child(module.name);
      moduleLogger.info('Initializing module');
      await module.init(moduleLogger);
      moduleLogger.info('Module ready');
    }
  }

  return { register, initAll };
}
