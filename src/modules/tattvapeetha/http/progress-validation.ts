import { z } from 'zod';

// ─── POST /tattvapeetha/progress/aggregate ──────────────────────────────────────
// The caller supplies the set of units to aggregate over (e.g. all units
// resolved from a module or path via the content endpoints). The progress
// module has no knowledge of paths or modules — only units and versions.
export const AggregateProgressBodySchema = z
  .object({
    unitIds: z.array(z.string().uuid()).min(1).max(500),
  })
  .strict();
export type AggregateProgressInput = z.infer<typeof AggregateProgressBodySchema>;
