// ─── Authentication configuration ────────────────────────────────────────────
// Environment parsing for JWT signing and token lifetimes. Kept separate
// from config/env.ts because the JWT secret is an auth-module concern, not a
// foundation-level concern — the foundation must remain ignorant of business
// modules. Parsing is fail-fast: called once at startup wiring time.

export interface AuthConfig {
  readonly jwtSecret: string;
  readonly accessTokenTtlMinutes: number;
  readonly refreshTokenTtlDays: number;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePositiveInt(name: string, raw: string): number {
  const value = Number.parseInt(raw, 10);
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error(`Invalid ${name}: "${raw}" must be a positive integer`);
  }
  return value;
}

export function loadAuthConfig(): AuthConfig {
  const accessTokenTtlRaw = process.env['AUTH_ACCESS_TOKEN_TTL_MINUTES'] ?? '15';
  const refreshTokenTtlRaw = process.env['AUTH_REFRESH_TOKEN_TTL_DAYS'] ?? '30';

  return {
    jwtSecret: requireEnv('AUTH_JWT_SECRET'),
    accessTokenTtlMinutes: parsePositiveInt(
      'AUTH_ACCESS_TOKEN_TTL_MINUTES',
      accessTokenTtlRaw,
    ),
    refreshTokenTtlDays: parsePositiveInt(
      'AUTH_REFRESH_TOKEN_TTL_DAYS',
      refreshTokenTtlRaw,
    ),
  };
}
