import type { HealthCheckable } from './health.js';
import type { TwilioSmsConfig } from './provider-config.js';
import type { SmsProvider } from './sms-provider.js';

const TWILIO_API_BASE = 'https://api.twilio.com/2010-04-01';

function authHeader(config: TwilioSmsConfig): string {
  const credentials = Buffer.from(`${config.accountSid}:${config.authToken}`).toString('base64');
  return `Basic ${credentials}`;
}

// ─── Twilio SMS provider ──────────────────────────────────────────────────────
// Sends SMS via Twilio's REST API using the platform's native fetch — no
// Twilio SDK dependency required. Satisfies SmsProvider for production use
// and HealthCheckable so credentials can be validated at startup.
export function createTwilioSmsProvider(
  config: TwilioSmsConfig,
): SmsProvider & HealthCheckable {
  return {
    async send(to: string, body: string): Promise<void> {
      const response = await fetch(
        `${TWILIO_API_BASE}/Accounts/${config.accountSid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: authHeader(config),
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            To: to,
            From: config.fromNumber,
            Body: body,
          }),
        },
      );

      if (!response.ok) {
        const details = await response.text();
        throw new Error(
          `Twilio SMS send failed with status ${response.status}: ${details}`,
        );
      }
    },

    async checkHealth(): Promise<void> {
      // Fetching the account resource verifies the Account SID and Auth
      // Token are valid without sending a real message.
      const response = await fetch(
        `${TWILIO_API_BASE}/Accounts/${config.accountSid}.json`,
        { headers: { Authorization: authHeader(config) } },
      );

      if (!response.ok) {
        throw new Error(
          `Twilio health check failed with status ${response.status}: invalid credentials or account SID`,
        );
      }
    },
  };
}
