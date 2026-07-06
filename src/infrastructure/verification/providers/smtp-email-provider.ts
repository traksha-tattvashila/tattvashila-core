import nodemailer from 'nodemailer';

import type { EmailProvider } from './email-provider.js';
import type { HealthCheckable } from './health.js';
import type { SmtpEmailConfig } from './provider-config.js';

// ─── SMTP email provider ──────────────────────────────────────────────────────
// Sends email over SMTP via nodemailer. Provider-agnostic by design — any
// SMTP-compatible service (SES, SendGrid, Mailgun, Postmark, self-hosted)
// works without a vendor-specific SDK. Satisfies EmailProvider for
// production use and HealthCheckable so the connection can be validated
// at startup.
export function createSmtpEmailProvider(
  config: SmtpEmailConfig,
): EmailProvider & HealthCheckable {
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: {
      user: config.user,
      pass: config.password,
    },
  });

  return {
    async send(to: string, subject: string, body: string): Promise<void> {
      await transporter.sendMail({
        from: config.fromAddress,
        to,
        subject,
        text: body,
      });
    },

    async checkHealth(): Promise<void> {
      await transporter.verify();
    },
  };
}
