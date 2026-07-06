import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

// ─── Authentication credentials ─────────────────────────────────────────────
// One password credential per constitutional identity. identityId is stored
// as a plain uuid column, not a foreign key — auth is a separate module and
// must not reach into the trk module's schema internals. Existence of the
// referenced identity is enforced at the service layer via IdentityService,
// which is the approved cross-module interface.
//
// Deliberately does not carry a foreign key to `identities`: modules own
// their own domain and never share DB-level internals with one another.
export const authCredentials = pgTable('auth_credentials', {
  identityId: uuid('identity_id').primaryKey(),

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
export const refreshTokens = pgTable('refresh_tokens', {
  id: uuid('id').primaryKey().defaultRandom(),

  identityId: uuid('identity_id').notNull(),

  tokenHash: text('token_hash').notNull().unique(),

  expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),

  revokedAt: timestamp('revoked_at', { withTimezone: true }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),
});
