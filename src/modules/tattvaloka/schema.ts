import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { identities } from '../trk/schema.js';

// ─── Tattvaloka participants ───────────────────────────────────────────────────
// Registers a constitutional identity's participation in the Tattvaloka
// (Constitutional Participation Layer). This table is a foundation only —
// it records that participation exists, nothing more.
//
// Constitutional rules:
// — A Tattvaloka participant is NOT a constitutional identity.
// — Exactly one participant record may exist per identity (UNIQUE on
//   identity_id).
// — ON DELETE RESTRICT: deleting a participant record never deletes the
//   identity. Deleting the identity while a participant record references
//   it is blocked by the DB.
// — Participant creation never creates another identity.
export const tattvalokaParticipants = pgTable('tattvaloka_participants', {
  id: uuid('id').primaryKey().defaultRandom(),

  identityId: uuid('identity_id')
    .notNull()
    .unique()
    .references(() => identities.id, { onDelete: 'restrict' }),

  joinedAt: timestamp('joined_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Tattvaloka memberships ─────────────────────────────────────────────────────
// Records that a constitutional identity has become a Tattvaloka member.
// Membership is a distinct concept from participation (above): a participant
// record establishes presence in the Tattvaloka layer; a membership record
// establishes formal membership status within it.
//
// Constitutional rules:
// — A Tattvaloka membership is NOT a constitutional identity.
// — Membership never modifies constitutional identity or TMP/TRK state.
// — Exactly one membership record may exist per identity (UNIQUE on
//   identity_id).
// — ON DELETE RESTRICT: deleting a membership record never deletes the
//   identity. Deleting the identity while a membership record references
//   it is blocked by the DB.
export const tattvalokaMemberships = pgTable('tattvaloka_memberships', {
  id: uuid('id').primaryKey().defaultRandom(),

  identityId: uuid('identity_id')
    .notNull()
    .unique()
    .references(() => identities.id, { onDelete: 'restrict' }),

  memberSince: timestamp('member_since', { withTimezone: true })
    .notNull()
    .defaultNow(),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
