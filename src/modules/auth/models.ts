// ─── Auth domain models ──────────────────────────────────────────────────────
// Read-side domain shapes for the authentication application layer.

export interface AuthCredential {
  readonly identityId: string;
  readonly passwordHash: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export interface RefreshTokenRecord {
  readonly id: string;
  readonly identityId: string;
  readonly tokenHash: string;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
  readonly createdAt: Date;
}

// A freshly issued token pair returned to the client. `refreshToken` is the
// raw opaque token — it exists only in memory and in this response; the
// database only ever stores its hash.
export interface TokenPair {
  readonly accessToken: string;
  readonly refreshToken: string;
}
