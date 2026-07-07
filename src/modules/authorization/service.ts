import { formatPermissionKey } from './engine.js';
import type { Permission, ResolvedPermissions, Role } from './models.js';
import type { AuthorizationRepository } from './repository.js';

// ─── Authorization service interface ─────────────────────────────────────────
// Answers "what is this identity allowed to do?" and provides the management
// operations required for application sprints to define and assign roles.
//
// Constitutional rules:
// — Never authenticates users; never modifies identity_state.
// — Always operates on an already-authenticated constitutional identity.
// — Permission evaluation is delegated to the pure engine (engine.ts).
export interface AuthorizationService {
  // Resolves all permissions held by an identity via their assigned roles.
  // Returns an empty permission set if the identity has no roles.
  resolvePermissionsForIdentity(identityId: string): Promise<ResolvedPermissions>;

  // ── Role management (used by application sprints, not by end users) ─────

  // Ensures a role exists. Returns the existing role if it already exists,
  // or creates and returns a new one. Idempotent.
  defineRole(name: string, description?: string): Promise<Role>;

  // Ensures a permission exists. Returns the existing permission if already
  // defined, or creates a new one. Idempotent.
  definePermission(resource: string, action: string): Promise<Permission>;

  // Ensures a role has the given permission. Idempotent.
  // Creates both the role and permission if they do not exist.
  grantPermissionToRole(
    roleName: string,
    resource: string,
    action: string,
  ): Promise<void>;

  // Assigns a role to an identity. The role must already exist.
  // Idempotent — assigning a role an identity already holds is a no-op.
  assignRole(identityId: string, roleName: string): Promise<void>;

  // Removes a role from an identity.
  // No-op if the identity does not hold the role.
  revokeRole(identityId: string, roleName: string): Promise<void>;
}

export function createAuthorizationService(
  repository: AuthorizationRepository,
): AuthorizationService {
  // ── Inner implementations using closures ───────────────────────────────────
  // Defined as named functions so grantPermissionToRole can reference them
  // directly without `this`, avoiding fragile implicit binding in object literals.

  async function defineRole(name: string, description?: string): Promise<Role> {
    const existing = await repository.findRoleByName(name);
    if (existing !== undefined) return existing;
    return repository.createRole(name, description);
  }

  async function definePermission(resource: string, action: string): Promise<Permission> {
    const existing = await repository.findPermissionByResourceAction(resource, action);
    if (existing !== undefined) return existing;
    return repository.createPermission(resource, action);
  }

  return {
    // ── Permission resolution ──────────────────────────────────────────────
    async resolvePermissionsForIdentity(identityId) {
      const assignedRoles = await repository.findRolesByIdentityId(identityId);

      if (assignedRoles.length === 0) {
        return { identityId, permissions: new Set<string>() };
      }

      const roleIds = assignedRoles.map((r) => r.id);
      const assignedPermissions = await repository.findPermissionsByRoleIds(roleIds);

      const permissionKeys = new Set(
        assignedPermissions.map((p) => formatPermissionKey(p.resource, p.action)),
      );

      return { identityId, permissions: permissionKeys };
    },

    defineRole,

    definePermission,

    // ── Grant permission to role ───────────────────────────────────────────
    async grantPermissionToRole(roleName, resource, action) {
      const [role, permission] = await Promise.all([
        defineRole(roleName),
        definePermission(resource, action),
      ]);
      await repository.assignPermissionToRole(role.id, permission.id);
    },

    // ── Identity ↔ role assignment ─────────────────────────────────────────
    async assignRole(identityId, roleName) {
      const role = await repository.findRoleByName(roleName);
      if (role === undefined) {
        throw new Error(
          `Cannot assign role: no role named "${roleName}" exists.`,
        );
      }
      await repository.assignRoleToIdentity(identityId, role.id);
    },

    async revokeRole(identityId, roleName) {
      const role = await repository.findRoleByName(roleName);
      if (role === undefined) return;
      await repository.revokeRoleFromIdentity(identityId, role.id);
    },
  };
}
