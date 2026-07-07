import { z } from 'zod';

// ─── Shared field schemas ─────────────────────────────────────────────────────
// displayName: non-empty string when present; null to clear; omit to leave.
const displayNameField = z
  .string()
  .trim()
  .min(1, { message: 'displayName must not be empty' })
  .nullable()
  .optional();

// bio: any string when present; null to clear; omit to leave.
const bioField = z.string().trim().nullable().optional();

// ─── Create profile ───────────────────────────────────────────────────────────
// POST /profile — all fields optional; profile can be created empty.
export const CreateProfileSchema = z.object({
  displayName: displayNameField,
  bio: bioField,
});

export type CreateProfileInput = z.infer<typeof CreateProfileSchema>;

// ─── Update profile ───────────────────────────────────────────────────────────
// PATCH /profile/me — at least one field must be provided.
export const UpdateProfileSchema = z
  .object({
    displayName: displayNameField,
    bio: bioField,
  })
  .refine(
    (data) => data.displayName !== undefined || data.bio !== undefined,
    { message: 'At least one field must be provided: displayName, bio.' },
  );

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
