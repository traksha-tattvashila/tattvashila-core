// ─── API response models ──────────────────────────────────────────────────────
// Typed shapes returned by the verification HTTP endpoints.
// These are the only response structures the handlers may produce.

// POST /verifications → 201
export interface InitiateVerificationResponse {
  readonly sessionId: string;
  readonly phoneVerificationId: string;
  readonly emailVerificationId: string;
}

// Created TMP identity embedded in the confirm response.
export interface IdentityResponse {
  readonly id: string;
  readonly state: string;
}

// POST /verifications/:verificationId/confirm → 200
export interface ConfirmVerificationResponse {
  // true when the OTP was correct; always true on 200 (errors produce 4xx).
  readonly verified: true;

  // true when both channels have been confirmed and the identity was created.
  readonly sessionComplete: boolean;

  // Present only when sessionComplete is true.
  readonly identity?: IdentityResponse;
}
