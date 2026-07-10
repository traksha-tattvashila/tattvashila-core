import { z } from 'zod';

// ─── Register participant ─────────────────────────────────────────────────────
// POST /tattvaloka — no input fields are accepted. The participant is
// derived entirely from the authenticated identity; an empty or absent body
// is required so callers cannot smuggle unrecognised fields into the request.
export const RegisterParticipantBodySchema = z.object({}).strict();

export type RegisterParticipantInput = z.infer<typeof RegisterParticipantBodySchema>;
