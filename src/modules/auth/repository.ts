import { eq } from 'drizzle-orm';

import { AppError } from '../../infrastructure/errors/app-error.js';
import type { DatabaseClient } from '../../infrastructure/database/client.js';
import { AuthError, AuthErrorCode } from './errors.js';
import type { AuthCredential, RefreshTokenRecord } from './models.js';
import { authCredentials, refreshTokens } from './schema.js';

// ─── Auth repository interface ────────────────────────────────────────────────
// Persistence-only. Never contains password/JWT business rules — those live
// in the auth service. Identity existence is not checked here; the service
// enforces that via IdentityService before calling into this repository.
export interface AuthRepository {
  // Creates a password credential for an identity.
  // Throws AuthError(CREDENTIAL_ALREADY_EXISTS) if one already exists.
  createCredential(identityId: string, passwordHash: string): Promise<void>;

  // Returns the credential for an identity, or undefined if none exists.
  findCredentialByIdentityId(identityId: string): Promise<AuthCredential | undefined>;

  // Persists a newly issued refresh token (hash only — never the raw token).
  createRefreshToken(
    identityId: string,
    tokenHash: string,
    expiresAt: Date,
  ): Promise<void>;

  // Looks up a refresh token by its hash, regardless of expiry/revocation
  // state — the service decides what "valid" means.
  findRefreshTokenByHash(tokenHash: string): Promise<RefreshTokenRecord | undefined>;

  // Marks a refresh token as revoked. Idempotent — revoking an
  // already-revoked token is a no-op.
  revokeRefreshToken(id: string): Promise<void>;
}

const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

export function createAuthRepository(db: DatabaseClient): AuthRepository {
  return {
    async createCredential(identityId, passwordHash) {
      try {
        await db.insert(authCredentials).values({ identityId, passwordHash });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new AuthError(
            'A password credential already exists for this identity.',
            AuthErrorCode.CREDENTIAL_ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    async findCredentialByIdentityId(identityId) {
      const rows = await db
        .select()
        .from(authCredentials)
        .where(eq(authCredentials.identityId, identityId))
        .limit(1);

      return rows[0];
    },

    async createRefreshToken(identityId, tokenHash, expiresAt) {
      await db.insert(refreshTokens).values({ identityId, tokenHash, expiresAt });
    },

    async findRefreshTokenByHash(tokenHash) {
      const rows = await db
        .select()
        .from(refreshTokens)
        .where(eq(refreshTokens.tokenHash, tokenHash))
        .limit(1);

      return rows[0];
    },

    async revokeRefreshToken(id) {
      const updated = await db
        .update(refreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(refreshTokens.id, id))
        .returning({ id: refreshTokens.id });

      if (updated.length === 0) {
        throw new AppError(
          `Refresh token revoke failed: no row found for id ${id}.`,
          'DB_UPDATE_FAILED',
          500,
        );
      }
    },
  };
}
