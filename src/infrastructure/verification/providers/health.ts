import type { Logger } from '../../../foundation/logger.js';
import type { EmailProvider } from './email-provider.js';
import type { SmsProvider } from './sms-provider.js';

// ─── Provider health check ────────────────────────────────────────────────────
// Optional capability a concrete provider implementation can expose so its
// credentials/connectivity can be validated at startup, before the HTTP
// server begins accepting traffic. Development providers do not implement
// this — there is nothing external to validate.
export interface HealthCheckable {
  // Resolves if the provider is reachable and its credentials are valid.
  // Rejects with a descriptive error otherwise.
  checkHealth(): Promise<void>;
}

function isHealthCheckable(provider: unknown): provider is HealthCheckable {
  return (
    typeof provider === 'object' &&
    provider !== null &&
    'checkHealth' in provider &&
    typeof (provider as HealthCheckable).checkHealth === 'function'
  );
}

// ─── Startup validation ───────────────────────────────────────────────────────
// Runs checkHealth() on every provider that supports it. Providers without
// the capability (e.g. dev providers) are skipped. Throws on the first
// failure so the caller can fail startup fast rather than accepting traffic
// against a provider that cannot actually send messages.
export async function validateProviderHealth(
  providers: { readonly sms: SmsProvider; readonly email: EmailProvider },
  logger: Logger,
): Promise<void> {
  const checks: Array<{ name: string; provider: SmsProvider | EmailProvider }> = [
    { name: 'sms', provider: providers.sms },
    { name: 'email', provider: providers.email },
  ];

  for (const { name, provider } of checks) {
    if (!isHealthCheckable(provider)) {
      logger.debug('Provider has no health check; skipping', { provider: name });
      continue;
    }

    await provider.checkHealth();
    logger.info('Provider health check passed', { provider: name });
  }
}
