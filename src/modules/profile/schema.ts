import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

import { identities } from '../trk/schema.js';

// ─── Identity profile ─────────────────────────────────────────────────────────
// Stores mutable user information for a constitutional identity.
//
// Constitutional rules:
// — A profile is NOT a constitutional identity.
// — Exactly one profile may exist per identity (UNIQUE on identity_id).
// — ON DELETE RESTRICT: deleting a profile never deletes the identity.
//   Deleting the identity while a profile references it is blocked by the DB.
// — Profile creation never creates another identity.
export const identityProfiles = pgTable('identity_profiles', {
  id: uuid('id').primaryKey().defaultRandom(),

  identityId: uuid('identity_id')
    .notNull()
    .unique()
    .references(() => identities.id, { onDelete: 'restrict' }),

  displayName: text('display_name'),

  bio: text('bio'),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
