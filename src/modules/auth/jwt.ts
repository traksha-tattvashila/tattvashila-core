import jwt from 'jsonwebtoken';

import { AuthError, AuthErrorCode } from './errors.js';

export interface AccessTokenPayload {
  readonly identityId: string;
}

// ─── Access token (JWT) ──────────────────────────────────────────────────────
// Short-lived, stateless proof of authentication. Carries only the
// constitutional identity UUID as `sub` — no roles, permissions, or profile
// data, since authorization is explicitly out of scope for this sprint.
export function signAccessToken(
  identityId: string,
  secret: string,
  ttlMinutes: number,
): string {
  return jwt.sign({}, secret, {
    subject: identityId,
    expiresIn: `${ttlMinutes}m`,
  });
}

export function verifyAccessToken(
  token: string,
  secret: string,
): AccessTokenPayload {
  try {
    const decoded = jwt.verify(token, secret);

    if (typeof decoded === 'string' || typeof decoded.sub !== 'string') {
      throw new Error('Access token payload is missing a subject.');
    }

    return { identityId: decoded.sub };
  } catch {
    throw new AuthError(
      'Access token is missing, malformed, or expired.',
      AuthErrorCode.ACCESS_TOKEN_INVALID,
    );
  }
}
