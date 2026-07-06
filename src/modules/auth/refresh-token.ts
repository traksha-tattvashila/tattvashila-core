import { createHash, randomBytes } from 'node:crypto';

const REFRESH_TOKEN_BYTES = 32;

// ─── Refresh token generation ────────────────────────────────────────────────
// Generates a cryptographically random opaque token. Only its SHA-256 hash
// is ever persisted — the raw value is returned to the caller exactly once,
// at issuance, and cannot be recovered from the database afterwards.
export function generateRefreshToken(): string {
  return randomBytes(REFRESH_TOKEN_BYTES).toString('base64url');
}

export function hashRefreshToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
