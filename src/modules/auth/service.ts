import type { ContactType } from '../trk/models.js';
import type { IdentityService } from '../trk/service.js';
import type { AuthConfig } from './config.js';
import { AuthError, AuthErrorCode } from './errors.js';
import { verifyAccessToken as verifyAccessTokenJwt, signAccessToken } from './jwt.js';
import type { TokenPair } from './models.js';
import { hashPassword, validatePasswordPolicy, verifyPassword } from './password.js';
import { generateRefreshToken, hashRefreshToken } from './refresh-token.js';
import type { AuthRepository } from './repository.js';

// ─── Auth service interface ──────────────────────────────────────────────────
// Authenticates existing constitutional identities. Never creates an
// identity, never changes identity_state, never transitions TMP to TRK —
// it only verifies who is making a request and issues/validates tokens.
export interface AuthService {
  // Sets the password credential for an existing identity.
  // Throws IdentityError(NOT_FOUND) if the identity does not exist.
  // Throws AuthError(WEAK_PASSWORD) if the password fails policy.
  // Throws AuthError(CREDENTIAL_ALREADY_EXISTS) if one is already set.
  setCredential(identityId: string, password: string): Promise<void>;

  // Authenticates by verified contact + password and issues a token pair.
  // Throws AuthError(INVALID_CREDENTIALS) for any failure reason (unknown
  // contact, no credential, wrong password) — deliberately indistinguishable.
  login(
    contactType: ContactType,
    contactValue: string,
    password: string,
  ): Promise<TokenPair>;

  // Rotates a refresh token: the presented token is revoked and a new
  // access/refresh pair is issued. Throws AuthError(REFRESH_TOKEN_INVALID)
  // if the token is unknown, expired, or already revoked.
  refresh(refreshToken: string): Promise<TokenPair>;

  // Revokes a refresh token. Idempotent — logging out twice is not an error.
  logout(refreshToken: string): Promise<void>;

  // Verifies an access token and returns the identity it authenticates.
  // Throws AuthError(ACCESS_TOKEN_INVALID) on any verification failure.
  verifyAccessToken(token: string): { identityId: string };
}

function refreshTokenExpiryDate(ttlDays: number): Date {
  return new Date(Date.now() + ttlDays * 24 * 60 * 60 * 1000);
}

export function createAuthService(deps: {
  repository: AuthRepository;
  identityService: IdentityService;
  config: AuthConfig;
}): AuthService {
  const { repository, identityService, config } = deps;

  async function issueTokenPair(identityId: string): Promise<TokenPair> {
    const accessToken = signAccessToken(
      identityId,
      config.jwtSecret,
      config.accessTokenTtlMinutes,
    );

    const rawRefreshToken = generateRefreshToken();
    const tokenHash = hashRefreshToken(rawRefreshToken);
    const expiresAt = refreshTokenExpiryDate(config.refreshTokenTtlDays);

    await repository.createRefreshToken(identityId, tokenHash, expiresAt);

    return { accessToken, refreshToken: rawRefreshToken };
  }

  return {
    async setCredential(identityId, password) {
      // Confirms the identity exists via the reused identity layer.
      // Propagates IdentityError(NOT_FOUND) unchanged if it does not.
      await identityService.getById(identityId);

      validatePasswordPolicy(password);

      const existing = await repository.findCredentialByIdentityId(identityId);
      if (existing !== undefined) {
        throw new AuthError(
          'A password credential already exists for this identity.',
          AuthErrorCode.CREDENTIAL_ALREADY_EXISTS,
        );
      }

      const passwordHash = await hashPassword(password);
      await repository.createCredential(identityId, passwordHash);
    },

    async login(contactType, contactValue, password) {
      let identityId: string;
      try {
        const identity = await identityService.getByVerifiedContact(
          contactType,
          contactValue,
        );
        identityId = identity.id;
      } catch {
        // Unknown contact — surface the same error as a wrong password so
        // the response never reveals whether the contact is registered.
        throw new AuthError(
          'Invalid contact or password.',
          AuthErrorCode.INVALID_CREDENTIALS,
        );
      }

      const credential = await repository.findCredentialByIdentityId(identityId);
      if (credential === undefined) {
        throw new AuthError(
          'Invalid contact or password.',
          AuthErrorCode.INVALID_CREDENTIALS,
        );
      }

      const passwordMatches = await verifyPassword(password, credential.passwordHash);
      if (!passwordMatches) {
        throw new AuthError(
          'Invalid contact or password.',
          AuthErrorCode.INVALID_CREDENTIALS,
        );
      }

      return issueTokenPair(identityId);
    },

    async refresh(refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const record = await repository.findRefreshTokenByHash(tokenHash);

      const isValid =
        record !== undefined &&
        record.revokedAt === null &&
        record.expiresAt.getTime() > Date.now();

      if (!record || !isValid) {
        throw new AuthError(
          'Refresh token is invalid, expired, or already used.',
          AuthErrorCode.REFRESH_TOKEN_INVALID,
        );
      }

      // Rotation: the presented token is single-use.
      await repository.revokeRefreshToken(record.id);

      return issueTokenPair(record.identityId);
    },

    async logout(refreshToken) {
      const tokenHash = hashRefreshToken(refreshToken);
      const record = await repository.findRefreshTokenByHash(tokenHash);

      if (record !== undefined && record.revokedAt === null) {
        await repository.revokeRefreshToken(record.id);
      }
    },

    verifyAccessToken(token) {
      return verifyAccessTokenJwt(token, config.jwtSecret);
    },
  };
}
