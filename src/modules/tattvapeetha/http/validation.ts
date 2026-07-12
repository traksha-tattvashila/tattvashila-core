import { z } from 'zod';

// ─── Register entity ─────────────────────────────────────────────────────────────
// POST /tattvapeetha — the only accepted input is the UUID of the owning
// institution. Ownership is fixed at creation and never reassigned, so no
// other field is accepted.
export const RegisterEntityBodySchema = z
  .object({
    institutionId: z.string().uuid(),
  })
  .strict();

export type RegisterEntityInput = z.infer<typeof RegisterEntityBodySchema>;
