const NODE_ENV_VALUES = ['development', 'production', 'test'] as const;
const LOG_LEVEL_VALUES = ['debug', 'info', 'warn', 'error'] as const;

export type NodeEnv = (typeof NODE_ENV_VALUES)[number];
export type LogLevel = (typeof LOG_LEVEL_VALUES)[number];

export interface Env {
  readonly nodeEnv: NodeEnv;
  readonly logLevel: LogLevel;
}

function parseNodeEnv(raw: string | undefined): NodeEnv {
  const value = raw ?? 'development';
  if ((NODE_ENV_VALUES as readonly string[]).includes(value)) {
    return value as NodeEnv;
  }
  throw new Error(
    `Invalid NODE_ENV: "${value}". Must be one of: ${NODE_ENV_VALUES.join(', ')}`
  );
}

function parseLogLevel(raw: string | undefined): LogLevel {
  const value = raw ?? 'info';
  if ((LOG_LEVEL_VALUES as readonly string[]).includes(value)) {
    return value as LogLevel;
  }
  throw new Error(
    `Invalid LOG_LEVEL: "${value}". Must be one of: ${LOG_LEVEL_VALUES.join(', ')}`
  );
}

function buildEnv(): Env {
  return Object.freeze({
    nodeEnv: parseNodeEnv(process.env['NODE_ENV']),
    logLevel: parseLogLevel(process.env['LOG_LEVEL']),
  });
}

export const env: Env = buildEnv();
