// SMS provider interface.
// A concrete implementation (Twilio, AWS SNS, etc.) will be provided in a
// future sprint when outbound messaging infrastructure is configured.
// This interface is the only contract this codebase depends on.

export interface SmsProvider {
  // Send a text message to a normalised E.164 phone number.
  // Resolves when the provider has accepted the message for delivery.
  // Rejects with the provider's native error on failure; callers are
  // responsible for wrapping in VerificationError.
  send(to: string, body: string): Promise<void>;
}
