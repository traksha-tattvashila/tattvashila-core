import { eq } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import { ProfileError, ProfileErrorCode } from './errors.js';
import type { CreateProfileData, Profile, ProfileUpdates } from './models.js';
import { identityProfiles } from './schema.js';

// ─── PostgreSQL error codes ───────────────────────────────────────────────────
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

// ─── Profile repository interface ─────────────────────────────────────────────
// Persistence-only. No business rules live here — the profile service decides
// what constitutes a valid operation; the repository only executes reads and
// writes against the database.
export interface ProfileRepository {
  // Creates a profile for the given constitutional identity.
  // Throws ProfileError(ALREADY_EXISTS) if a profile already exists for
  // this identity (unique constraint on identity_id).
  createProfile(identityId: string, data: CreateProfileData): Promise<Profile>;

  // Retrieves a profile by constitutional identity UUID.
  // Returns undefined if no profile exists — callers decide how to surface
  // absence (the service maps this to ProfileError).
  findByIdentityId(identityId: string): Promise<Profile | undefined>;

  // Updates mutable fields on an existing profile.
  // Only the fields present in `updates` are written — undefined means
  // "leave unchanged", null means "clear the value".
  // Returns the updated profile, or undefined if no profile exists for the
  // given identity (the service maps this to ProfileError).
  updateProfile(
    identityId: string,
    updates: ProfileUpdates,
  ): Promise<Profile | undefined>;
}

export function createProfileRepository(db: DatabaseClient): ProfileRepository {
  return {
    async createProfile(identityId, data) {
      try {
        const rows = await db
          .insert(identityProfiles)
          .values({
            identityId,
            displayName: data.displayName ?? null,
            bio: data.bio ?? null,
          })
          .returning();

        const row = rows[0];
        if (!row) {
          throw new Error('Profile creation failed: no row returned.');
        }
        return row;
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new ProfileError(
            'A profile already exists for this identity.',
            ProfileErrorCode.ALREADY_EXISTS,
          );
        }
        throw error;
      }
    },

    async findByIdentityId(identityId) {
      const rows = await db
        .select()
        .from(identityProfiles)
        .where(eq(identityProfiles.identityId, identityId))
        .limit(1);
      return rows[0];
    },

    async updateProfile(identityId, updates) {
      // Build the set payload containing only the fields explicitly provided.
      // undefined means "not in the update"; null means "set to NULL".
      const setValues: Partial<{
        displayName: string | null;
        bio: string | null;
      }> = {};

      if (updates.displayName !== undefined) {
        setValues.displayName = updates.displayName;
      }
      if (updates.bio !== undefined) {
        setValues.bio = updates.bio;
      }

      const rows = await db
        .update(identityProfiles)
        .set(setValues)
        .where(eq(identityProfiles.identityId, identityId))
        .returning();

      return rows[0];
    },
  };
}
