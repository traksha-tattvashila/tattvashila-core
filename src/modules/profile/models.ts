// ─── Profile domain models ────────────────────────────────────────────────────
// Read-side domain shape and input types for the profile application layer.

// The full read model for an identity profile.
export interface Profile {
  readonly id: string;
  readonly identityId: string;
  readonly displayName: string | null;
  readonly bio: string | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

// Input for profile creation. All mutable fields are optional — the profile
// can be created empty and populated later via update.
export interface CreateProfileData {
  readonly displayName?: string | null;
  readonly bio?: string | null;
}

// Input for profile update. At least one field must be present.
// Undefined means "leave unchanged"; null means "clear the field".
export interface ProfileUpdates {
  readonly displayName?: string | null;
  readonly bio?: string | null;
}
