import { pgTable, primaryKey, text, timestamp, unique, uuid } from 'drizzle-orm/pg-core';

import { identities } from '../trk/schema.js';

// ─── Roles ───────────────────────────────────────────────────────────────────
// A role is a named collection of permissions. Role names are unique and
// stable — they are referenced by name from application sprints.
export const roles = pgTable('roles', {
  id: uuid('id').primaryKey().defaultRandom(),

  name: text('name').notNull().unique(),

  description: text('description'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Permissions ─────────────────────────────────────────────────────────────
// A permission is a (resource, action) pair. The canonical string form is
// "resource:action" (e.g. "identities:read"). The UNIQUE constraint on
// (resource, action) ensures a permission can never be defined twice.
export const permissions = pgTable(
  'permissions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    resource: text('resource').notNull(),

    action: text('action').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    resourceActionUnique: unique('permissions_resource_action_unique').on(
      table.resource,
      table.action,
    ),
  }),
);

// ─── Role permissions ────────────────────────────────────────────────────────
// Join table between roles and permissions. ON DELETE RESTRICT on both sides
// prevents a role or permission from being deleted while assignments exist.
export const rolePermissions = pgTable(
  'role_permissions',
  {
    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),

    permissionId: uuid('permission_id')
      .notNull()
      .references(() => permissions.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.roleId, table.permissionId] }),
  }),
);

// ─── Identity roles ──────────────────────────────────────────────────────────
// Assigns roles to constitutional identities. identity_id carries a FK to
// identities.id — authorization can only be assigned to a real constitutional
// identity. ON DELETE RESTRICT on both sides prevents orphaned assignments.
export const identityRoles = pgTable(
  'identity_roles',
  {
    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),

    roleId: uuid('role_id')
      .notNull()
      .references(() => roles.id, { onDelete: 'restrict' }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.identityId, table.roleId] }),
  }),
);
