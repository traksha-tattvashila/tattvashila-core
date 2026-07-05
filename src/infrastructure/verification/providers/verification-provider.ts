import { VerificationError, VerificationErrorCode } from '../errors.js';
import type { ContactChannel, VerificationMessage } from '../models.js';
import type { EmailProvider } from './email-provider.js';
import type { SmsProvider } from './sms-provider.js';

// ─── Verification provider interface ─────────────────────────────────────────
// A unified abstraction over channel-specific providers.
// Callers supply a ContactChannel and a VerificationMessage; the implementation
// routes to the correct transport without shaping message content.
// OTP generation and message composition belong to a future sprint.
export interface VerificationProvider {
  send(channel: ContactChannel, message: VerificationMessage): Promise<void>;
}

// ─── Channel-routing factory ──────────────────────────────────────────────────
// Composes an SmsProvider and an EmailProvider into a single VerificationProvider
// that routes by channel type.
// Throws CHANNEL_UNSUPPORTED if a channel type is encountered that has no
// registered transport — which cannot happen given the current ContactChannel
// union, but is guarded against to remain correct as the union evolves.
export function createVerificationProvider(
  sms: SmsProvider,
  email: EmailProvider,
): VerificationProvider {
  return {
    async send(
      channel: ContactChannel,
      message: VerificationMessage,
    ): Promise<void> {
      try {
        if (channel.type === 'phone') {
          await sms.send(channel.value, message.body);
          return;
        }

        if (channel.type === 'email') {
          await email.send(channel.value, message.subject, message.body);
          return;
        }

        // Exhaustiveness guard — TypeScript narrows channel to never here if
        // the ContactChannel union is fully covered above.
        const _exhaustive: never = channel;
        throw new VerificationError(
          `Unsupported contact channel: ${JSON.stringify(_exhaustive)}`,
          VerificationErrorCode.CHANNEL_UNSUPPORTED,
        );
      } catch (error) {
        if (error instanceof VerificationError) throw error;

        throw new VerificationError(
          `Failed to send verification to channel type "${channel.type}"`,
          VerificationErrorCode.SEND_FAILED,
          error,
        );
      }
    },
  };
}
