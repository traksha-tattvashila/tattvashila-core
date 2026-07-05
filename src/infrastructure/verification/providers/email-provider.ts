// Email provider interface.
// A concrete implementation (SES, SendGrid, SMTP, etc.) will be provided in a
// future sprint when outbound messaging infrastructure is configured.
// This interface is the only contract this codebase depends on.

export interface EmailProvider {
  // Send an email to a normalised lowercase email address.
  // Resolves when the provider has accepted the message for delivery.
  // Rejects with the provider's native error on failure; callers are
  // responsible for wrapping in VerificationError.
  send(to: string, subject: string, body: string): Promise<void>;
}
