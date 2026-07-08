import { z } from 'zod';

import { PublicIdSchema } from '../public-id/validation.js';

// ─── GET /identities/public/:publicId ────────────────────────────────────────
export const PublicIdParamSchema = z.object({
  publicId: PublicIdSchema,
});

export type PublicIdParamInput = z.infer<typeof PublicIdParamSchema>;
