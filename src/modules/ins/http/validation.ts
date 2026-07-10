import { z } from 'zod';

// ─── POST /institutions ───────────────────────────────────────────────────────
export const RegisterInstitutionBodySchema = z.object({
  name: z
    .string()
    .min(1, { message: 'name is required' })
    .max(255, { message: 'name must be at most 255 characters' }),
});

export type RegisterInstitutionBodyInput = z.infer<
  typeof RegisterInstitutionBodySchema
>;

// ─── GET /institutions/public/:insId ─────────────────────────────────────────
// Accepts only INS-family identifiers — TMP/TRK identifiers have no
// institution and would always 404, so an explicit format check produces
// a cleaner 400 error before the database is consulted.
const INS_FORMAT = /^INS-[A-Z0-9]{12}$/;

export const InsIdParamSchema = z.object({
  insId: z.string().regex(INS_FORMAT, {
    message:
      'insId must be a valid INS identifier (INS-XXXXXXXXXXXX, uppercase alphanumeric).',
  }),
});

export type InsIdParamInput = z.infer<typeof InsIdParamSchema>;
