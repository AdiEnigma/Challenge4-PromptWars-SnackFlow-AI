/**
 * SnackFlow AI - Logger
 * Simple leveled console logger used by database tooling. Avoids an external
 * dependency so the database package can run standalone (e.g. migrations).
 */
export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

const order: Record<LogLevel, number> = { error: 0, warn: 1, info: 2, debug: 3 };
const current = (process.env.LOG_LEVEL as LogLevel) || 'info';

function log(level: LogLevel, scope: string, args: unknown[]): void {
  if (order[level] > order[current]) return;
  const ts = new Date().toISOString();
  const prefix = `[${ts}] [${level.toUpperCase()}] [${scope}]`;
  // eslint-disable-next-line no-console
  console[level === 'debug' ? 'log' : level](prefix, ...args);
}

export const logger = {
  error: (scope: string, ...args: unknown[]) => log('error', scope, args),
  warn: (scope: string, ...args: unknown[]) => log('warn', scope, args),
  info: (scope: string, ...args: unknown[]) => log('info', scope, args),
  debug: (scope: string, ...args: unknown[]) => log('debug', scope, args),
};
