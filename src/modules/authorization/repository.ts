import { and, eq, inArray } from 'drizzle-orm';

import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { Permission, Role } from './models.js';
import {
  identityRoles,
  permissions,
  rolePermissions,
  roles,
} from './schema.js';

// ─── Authorization repository interface ──────────────────────────────────────
// Persistence-only. No business rules live here — the authorization service
// decides what constitutes a valid assignment; the repository only executes
// reads and writes against the database.
export interface AuthorizationRepository {
  // Role management
  createRole(name: string, description?: string): Promise<Role>;
  findRoleByName(name: string): Promise<Role | undefined>;

  // Permission management
  createPermission(resource: string, action: string): Promise<Permission>;
  findPermissionByResourceAction(
    resource: string,
    action: string,
  ): Promise<Permission | undefined>;

  // Role ↔ permission assignment (idempotent — insert ignored on conflict)
  assignPermissionToRole(roleId: string, permissionId: string): Promise<void>;

  // Identity ↔ role assignment
  // assignRoleToIdentity is idempotent — inserting an existing assignment is a no-op.
  assignRoleToIdentity(identityId: string, roleId: string): Promise<void>;
  // revokeRoleFromIdentity is a no-op if the assignment does not exist.
  revokeRoleFromIdentity(identityId: string, roleId: string): Promise<void>;

  // Resolution queries — used by the service to build ResolvedPermissions
  findRolesByIdentityId(identityId: string): Promise<Role[]>;
  findPermissionsByRoleIds(roleIds: string[]): Promise<Permission[]>;
}

export function createAuthorizationRepository(
  db: DatabaseClient,
): AuthorizationRepository {
  return {
    // ── Role management ────────────────────────────────────────────────────
    async createRole(name, description) {
      const rows = await db
        .insert(roles)
        .values({ name, description: description ?? null })
        .returning();

      const row = rows[0];
      if (!row) throw new Error(`Failed to create role: ${name}`);
      return row;
    },

    async findRoleByName(name) {
      const rows = await db
        .select()
        .from(roles)
        .where(eq(roles.name, name))
        .limit(1);
      return rows[0];
    },

    // ── Permission management ──────────────────────────────────────────────
    async createPermission(resource, action) {
      const rows = await db
        .insert(permissions)
        .values({ resource, action })
        .returning();

      const row = rows[0];
      if (!row) throw new Error(`Failed to create permission: ${resource}:${action}`);
      return row;
    },

    async findPermissionByResourceAction(resource, action) {
      const rows = await db
        .select()
        .from(permissions)
        .where(and(eq(permissions.resource, resource), eq(permissions.action, action)))
        .limit(1);
      return rows[0];
    },

    // ── Role ↔ permission assignment ───────────────────────────────────────
    async assignPermissionToRole(roleId, permissionId) {
      await db
        .insert(rolePermissions)
        .values({ roleId, permissionId })
        .onConflictDoNothing();
    },

    // ── Identity ↔ role assignment ─────────────────────────────────────────
    async assignRoleToIdentity(identityId, roleId) {
      await db
        .insert(identityRoles)
        .values({ identityId, roleId })
        .onConflictDoNothing();
    },

    async revokeRoleFromIdentity(identityId, roleId) {
      await db
        .delete(identityRoles)
        .where(
          and(
            eq(identityRoles.identityId, identityId),
            eq(identityRoles.roleId, roleId),
          ),
        );
    },

    // ── Resolution queries ─────────────────────────────────────────────────
    async findRolesByIdentityId(identityId) {
      const rows = await db
        .select({ role: roles })
        .from(identityRoles)
        .innerJoin(roles, eq(identityRoles.roleId, roles.id))
        .where(eq(identityRoles.identityId, identityId));

      return rows.map((r) => r.role);
    },

    async findPermissionsByRoleIds(roleIds) {
      if (roleIds.length === 0) return [];

      const rows = await db
        .select({ permission: permissions })
        .from(rolePermissions)
        .innerJoin(
          permissions,
          eq(rolePermissions.permissionId, permissions.id),
        )
        .where(inArray(rolePermissions.roleId, roleIds));

      return rows.map((r) => r.permission);
    },
  };
}
