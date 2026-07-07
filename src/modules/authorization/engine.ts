import type { ResolvedPermissions } from './models.js';

// ─── Permission evaluation engine ────────────────────────────────────────────
// Pure functions — no I/O, no side effects. The engine answers one question:
// does a resolved permission set include a given (resource, action) pair?
// Keeping evaluation pure ensures it can be tested in isolation and called
// synchronously inside middleware without awaiting anything.

// The canonical string form of a permission: "resource:action".
// All permission keys stored in ResolvedPermissions use this format.
export function formatPermissionKey(resource: string, action: string): string {
  return `${resource}:${action}`;
}

// Returns true if the resolved permission set contains the required permission.
export function hasPermission(
  resolved: ResolvedPermissions,
  resource: string,
  action: string,
): boolean {
  return resolved.permissions.has(formatPermissionKey(resource, action));
}
