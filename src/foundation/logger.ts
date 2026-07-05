import { env, type LogLevel } from '../../config/env.js';

const LOG_LEVEL_RANK: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

export interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
  child(context: string): Logger;
}

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  context?: string;
  message: string;
  [key: string]: unknown;
}

function isLevelEnabled(level: LogLevel): boolean {
  return LOG_LEVEL_RANK[level] >= LOG_LEVEL_RANK[env.logLevel];
}

function emit(level: LogLevel, message: string, meta: Record<string, unknown>): void {
  if (!isLevelEnabled(level)) return;

  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    ...meta,
    message,
  };

  const line = JSON.stringify(entry) + '\n';

  if (level === 'error' || level === 'warn') {
    process.stderr.write(line);
  } else {
    process.stdout.write(line);
  }
}

function createLogger(context?: string): Logger {
  const baseMeta: Record<string, unknown> = context ? { context } : {};

  return {
    debug(message, meta) {
      emit('debug', message, { ...baseMeta, ...meta });
    },
    info(message, meta) {
      emit('info', message, { ...baseMeta, ...meta });
    },
    warn(message, meta) {
      emit('warn', message, { ...baseMeta, ...meta });
    },
    error(message, meta) {
      emit('error', message, { ...baseMeta, ...meta });
    },
    child(childContext) {
      const name = context ? `${context}:${childContext}` : childContext;
      return createLogger(name);
    },
  };
}

export const logger: Logger = createLogger();
