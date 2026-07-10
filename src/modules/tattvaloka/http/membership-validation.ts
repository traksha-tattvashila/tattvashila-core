import { z } from 'zod';

// ─── Register membership ──────────────────────────────────────────────────────
// POST /tattvaloka/membership — no input fields are accepted. The membership
// is derived entirely from the authenticated identity; an empty or absent
// body is required so callers cannot smuggle unrecognised fields into the
// request.
export const RegisterMembershipBodySchema = z.object({}).strict();

export type RegisterMembershipInput = z.infer<typeof RegisterMembershipBodySchema>;
