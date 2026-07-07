// ─── Authorization API response models ───────────────────────────────────────
// Typed shapes returned by the authorization HTTP endpoints.

// GET /authorization/me → 200
// Returns the authenticated identity's resolved permission set as a sorted
// array of "resource:action" strings, suitable for client-side capability checks.
export interface MePermissionsResponse {
  readonly identityId: string;
  readonly permissions: readonly string[];
}
