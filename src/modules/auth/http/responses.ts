import type { TokenPair } from '../models.js';

// ─── API response models ─────────────────────────────────────────────────────
// Typed shapes returned by the auth HTTP endpoints.

// POST /auth/login → 200
// POST /auth/refresh → 200
export interface TokenPairResponse {
  readonly accessToken: string;
  readonly refreshToken: string;
}

export function toTokenPairResponse(pair: TokenPair): TokenPairResponse {
  return { accessToken: pair.accessToken, refreshToken: pair.refreshToken };
}

// GET /auth/session → 200
export interface SessionResponse {
  readonly identityId: string;
  readonly identityState: string;
}
