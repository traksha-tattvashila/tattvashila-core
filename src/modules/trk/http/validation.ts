import { z } from 'zod';

// ─── Identity lookup by UUID ──────────────────────────────────────────────────
export const IdentityIdParamSchema = z.object({
  id: z.string().uuid({ message: 'id must be a valid UUID' }),
});

export type IdentityIdParamInput = z.infer<typeof IdentityIdParamSchema>;

// ─── Identity lookup by verified contact ─────────────────────────────────────
// contactType mirrors the `contact_type` enum in the TRK constitutional schema.
// contactValue is validated for presence only — normalisation (E.164, lowercase)
// is the responsibility of the caller, matching the verification module's rule.
export const IdentityByContactQuerySchema = z.object({
  contactType: z.enum(['phone', 'email'], {
    message: 'contactType must be one of: phone, email',
  }),

  contactValue: z
    .string()
    .min(1, { message: 'contactValue is required' }),
});

export type IdentityByContactQueryInput = z.infer<
  typeof IdentityByContactQuerySchema
>;
