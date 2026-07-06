import type { Logger } from '../../../foundation/logger.js';
import type { SmsProvider } from './sms-provider.js';

// ─── Development SMS provider ─────────────────────────────────────────────────
// Satisfies SmsProvider by writing the OTP to stdout via the logger.
// Exists so the verification stack boots and is exercisable in development
// without a real SMS gateway. Must never be registered in production;
// a production-grade provider (Twilio, AWS SNS, etc.) must be substituted.
export function createDevSmsProvider(logger: Logger): SmsProvider {
  return {
    async send(to: string, body: string): Promise<void> {
      logger.info('[DEV] SMS dispatched', { to, body });
    },
  };
}
