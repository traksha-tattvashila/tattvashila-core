// ─── Production provider configuration ───────────────────────────────────────
// Environment parsing for the concrete SMS/email providers, kept separate
// from config/env.ts because these values are only required when running
// against production providers — development mode never reads them.
// Parsing is fail-fast: a missing or malformed variable throws immediately
// so misconfiguration is caught at startup, not on the first send attempt.

export interface TwilioSmsConfig {
  readonly accountSid: string;
  readonly authToken: string;
  readonly fromNumber: string; // E.164
}

export interface SmtpEmailConfig {
  readonly host: string;
  readonly port: number;
  readonly secure: boolean;
  readonly user: string;
  readonly password: string;
  readonly fromAddress: string;
}

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function parsePort(name: string, raw: string): number {
  const port = Number.parseInt(raw, 10);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) {
    throw new Error(`Invalid ${name}: "${raw}" is not a valid port number`);
  }
  return port;
}

function parseBoolean(name: string, raw: string | undefined, fallback: boolean): boolean {
  if (raw === undefined) return fallback;
  if (raw === 'true') return true;
  if (raw === 'false') return false;
  throw new Error(`Invalid ${name}: "${raw}" must be "true" or "false"`);
}

export function loadTwilioSmsConfig(): TwilioSmsConfig {
  return {
    accountSid: requireEnv('TWILIO_ACCOUNT_SID'),
    authToken: requireEnv('TWILIO_AUTH_TOKEN'),
    fromNumber: requireEnv('TWILIO_FROM_NUMBER'),
  };
}

export function loadSmtpEmailConfig(): SmtpEmailConfig {
  const portRaw = requireEnv('SMTP_PORT');

  return {
    host: requireEnv('SMTP_HOST'),
    port: parsePort('SMTP_PORT', portRaw),
    secure: parseBoolean('SMTP_SECURE', process.env['SMTP_SECURE'], false),
    user: requireEnv('SMTP_USER'),
    password: requireEnv('SMTP_PASSWORD'),
    fromAddress: requireEnv('SMTP_FROM_ADDRESS'),
  };
}
