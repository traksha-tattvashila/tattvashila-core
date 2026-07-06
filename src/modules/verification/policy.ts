// ─── Verification policy ─────────────────────────────────────────────────────
// Configurable lifecycle parameters for the verification engine.
// All values are positive integers. Units are documented inline.
// The default policy is suitable for development and initial production use;
// callers may supply an override at engine construction time.
export interface VerificationPolicy {
  // Number of digits in the generated OTP. Must be between 4 and 10.
  readonly otpLength: number;

  // How long (in seconds) a verification record remains valid after creation
  // or resend. After this window the record is treated as absent by the cache.
  readonly ttlSeconds: number;

  // Maximum number of failed OTP submissions permitted before the record is
  // locked. Once this limit is reached, verify() throws MAX_ATTEMPTS_EXCEEDED
  // and no further attempts are accepted against the same record.
  readonly maxAttempts: number;

  // Minimum time (in seconds) that must elapse between consecutive resend
  // requests for the same verification id. Prevents message flooding.
  readonly resendCooldownSeconds: number;
}

export const defaultVerificationPolicy: VerificationPolicy = Object.freeze({
  otpLength: 6,
  ttlSeconds: 300,           // 5 minutes
  maxAttempts: 5,
  resendCooldownSeconds: 60, // 1 minute
});
