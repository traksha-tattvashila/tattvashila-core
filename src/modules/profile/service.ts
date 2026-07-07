import { ProfileError, ProfileErrorCode } from './errors.js';
import type { CreateProfileData, Profile, ProfileUpdates } from './models.js';
import type { ProfileRepository } from './repository.js';

// ─── Profile service interface ────────────────────────────────────────────────
// Manages mutable profile data for constitutional identities.
//
// Constitutional rules:
// — Never creates or modifies a constitutional identity.
// — Never modifies identity_state.
// — Always operates on an already-authenticated constitutional identity.
// — Exactly one profile per identity is enforced at both the service and
//   database layer.
export interface ProfileService {
  // Creates a profile for the given identity.
  // Throws ProfileError(ALREADY_EXISTS) if a profile already exists.
  createProfile(identityId: string, data: CreateProfileData): Promise<Profile>;

  // Retrieves the profile for the given identity.
  // Throws ProfileError(NOT_FOUND) if no profile exists.
  getProfile(identityId: string): Promise<Profile>;

  // Updates mutable fields on the profile for the given identity.
  // Throws ProfileError(NOT_FOUND) if no profile exists.
  // Undefined fields in `updates` are left unchanged.
  // Null fields in `updates` clear the stored value.
  updateProfile(identityId: string, updates: ProfileUpdates): Promise<Profile>;
}

export function createProfileService(repository: ProfileRepository): ProfileService {
  return {
    async createProfile(identityId, data) {
      return repository.createProfile(identityId, data);
    },

    async getProfile(identityId) {
      const profile = await repository.findByIdentityId(identityId);
      if (profile === undefined) {
        throw new ProfileError(
          'No profile exists for this identity.',
          ProfileErrorCode.NOT_FOUND,
        );
      }
      return profile;
    },

    async updateProfile(identityId, updates) {
      const profile = await repository.updateProfile(identityId, updates);
      if (profile === undefined) {
        throw new ProfileError(
          'No profile exists for this identity.',
          ProfileErrorCode.NOT_FOUND,
        );
      }
      return profile;
    },
  };
}
