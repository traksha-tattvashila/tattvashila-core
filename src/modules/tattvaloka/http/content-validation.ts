import { z } from 'zod';

// ─── Content key format ────────────────────────────────────────────────────────
// Lowercase alphanumeric segments separated by single hyphens. Deliberately
// distinct from a raw UUID (no fixed hyphen positions or hex-only alphabet)
// and from the TMP/TRK/INS public identifier standard (uppercase, prefixed,
// randomly generated) — content keys are human-authored, immutable slugs.
const CONTENT_KEY_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

const ContentKeySchema = z
  .string()
  .min(3)
  .max(128)
  .regex(
    CONTENT_KEY_PATTERN,
    'Content key must be lowercase alphanumeric segments separated by single hyphens.',
  );

const TitleSchema = z.string().min(1).max(256);

// ─── POST /tattvaloka/content/paths ────────────────────────────────────────────
export const CreatePathBodySchema = z
  .object({
    contentKey: ContentKeySchema,
    title: TitleSchema,
  })
  .strict();
export type CreatePathInput = z.infer<typeof CreatePathBodySchema>;

// ─── POST /tattvaloka/content/modules ──────────────────────────────────────────
export const CreateModuleBodySchema = z
  .object({
    pathId: z.string().uuid(),
    contentKey: ContentKeySchema,
    title: TitleSchema,
  })
  .strict();
export type CreateModuleInput = z.infer<typeof CreateModuleBodySchema>;

// ─── POST /tattvaloka/content/units ────────────────────────────────────────────
export const CreateUnitBodySchema = z
  .object({
    moduleId: z.string().uuid(),
    contentKey: ContentKeySchema,
  })
  .strict();
export type CreateUnitInput = z.infer<typeof CreateUnitBodySchema>;

// ─── POST /tattvaloka/content/units/:id/versions ───────────────────────────────
export const AddVersionBodySchema = z
  .object({
    title: TitleSchema,
    body: z.string().min(1),
  })
  .strict();
export type AddVersionInput = z.infer<typeof AddVersionBodySchema>;

// ─── POST /tattvaloka/content/{paths,modules}/:id/status ───────────────────────
// Only the closed constitutional enumeration is accepted; the service
// enforces which transitions are actually permitted from the current state.
export const TransitionStatusBodySchema = z
  .object({
    status: z.enum(['published', 'retired']),
  })
  .strict();
export type TransitionStatusInput = z.infer<typeof TransitionStatusBodySchema>;
