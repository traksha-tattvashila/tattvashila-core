import type { Request } from 'express';

// ─── Authenticated request ───────────────────────────────────────────────────
// Populated by the auth middleware after a valid access token is verified.
// Carries only the constitutional identity id — no roles or permissions,
// since authorization is out of scope for this sprint.
export interface AuthenticatedRequest extends Request {
  identityId: string;
}
