import type { NodeEnv } from '../../../../config/env.js';
import type { Logger } from '../../../foundation/logger.js';
import { createDevEmailProvider } from './dev-email-provider.js';
import { createDevSmsProvider } from './dev-sms-provider.js';
import type { EmailProvider } from './email-provider.js';
import { loadSmtpEmailConfig, loadTwilioSmsConfig } from './provider-config.js';
import { createSmtpEmailProvider } from './smtp-email-provider.js';
import type { SmsProvider } from './sms-provider.js';
import { createTwilioSmsProvider } from './twilio-sms-provider.js';

// ─── Provider resolution ───────────────────────────────────────────────────────
// Selects the concrete SmsProvider/EmailProvider implementation for the
// running environment. Development and test use the in-memory dev
// providers (log-only, no external calls). Production uses real Twilio/SMTP
// providers, configured from environment variables. Config parsing is
// fail-fast — an incomplete production configuration throws immediately
// rather than deferring the failure to the first send attempt.
export function createSmsProvider(nodeEnv: NodeEnv, logger: Logger): SmsProvider {
  if (nodeEnv === 'production') {
    return createTwilioSmsProvider(loadTwilioSmsConfig());
  }

  return createDevSmsProvider(logger);
}

export function createEmailProvider(nodeEnv: NodeEnv, logger: Logger): EmailProvider {
  if (nodeEnv === 'production') {
    return createSmtpEmailProvider(loadSmtpEmailConfig());
  }

  return createDevEmailProvider(logger);
}
