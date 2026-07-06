import type { Logger } from '../../../foundation/logger.js';
import type { EmailProvider } from './email-provider.js';

// ─── Development email provider ───────────────────────────────────────────────
// Satisfies EmailProvider by writing the message content to stdout via the
// logger. Exists so the verification stack boots and is exercisable in
// development without a real email gateway. Must never be registered in
// production; a production-grade provider (SES, SendGrid, SMTP, etc.) must
// be substituted.
export function createDevEmailProvider(logger: Logger): EmailProvider {
  return {
    async send(to: string, subject: string, body: string): Promise<void> {
      logger.info('[DEV] Email dispatched', { to, subject, body });
    },
  };
}
