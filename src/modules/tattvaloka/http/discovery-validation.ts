import { z } from 'zod';

// ─── GET /tattvaloka/discovery/content?q= ───────────────────────────────────────
// The search term must be non-trivial — an empty or whitespace-only query
// would otherwise match every published content row.
export const ContentSearchQuerySchema = z.object({
  q: z.string().trim().min(1).max(200),
});
export type ContentSearchQueryInput = z.infer<typeof ContentSearchQuerySchema>;
