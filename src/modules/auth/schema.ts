import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { identities } from '../trk/schema.js';

// ─── Authentication credentials ─────────────────────────────────────────────
// One password credential per constitutional identity. identityId carries a
// FK to identities.id with ON DELETE RESTRICT so the database enforces the
// constitutional rule that authentication can only exist for a real identity.
// The FK imports identities from the trk schema — a schema-level dependency
// in the same allowed direction as the service-layer dependency that already
// exists (AuthService → IdentityService). Module isolation is an application-
// layer concern; DB integrity constraints are not a module boundary violation.
export const authCredentials = pgTable('auth_credentials', {
  identityId: uuid('identity_id')
    .primaryKey()
    .references(() => identities.id, { onDelete: 'restrict' }),

  passwordHash: text('password_hash').notNull(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Refresh tokens ──────────────────────────────────────────────────────────
// Opaque refresh tokens are never stored in plaintext — only their SHA-256
// hash is persisted, so a database read alone cannot be used to mint a
// session. A token is single-use: refresh() revokes the presented token and
// issues a new one (rotation), so a stolen-then-replayed token is detectable.
// identityId carries a FK to identities.id for the same integrity reasons as
// auth_credentials above.
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),

  identityId: uuid('identity_id')
    .notNull()
    .references(() => identities.id, { onDelete: 'restrict' }),

  tokenHash: text('token_hash').notNull().unique(),

  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  revokedAt: timestamp('revoked_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
