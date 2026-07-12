import { pgTable, timestamp, uuid } from 'drizzle-orm/pg-core';

import { institutions } from '../ins/schema.js';

// ─── Tattvapeetha entities ───────────────────────────────────────────────────────
// Establishes the constitutional entity model for Tattvapeetha, anchored to
// the frozen Institution Identity Foundation (INS). Mirrors the discipline
// applied to Tattvaloka's own foundation sprint (tattvaloka_participants):
// a single foundation record establishing existence, nothing more.
//
// Constitutional rules:
// — A Tattvapeetha entity is institution-owned: it resolves to exactly one
//   owning INS, never plural, never ambiguous.
// — Ownership is fixed at creation and never reassigned — there is no
//   transfer operation.
// — This sprint defines no individual (TMP) affiliation records; any such
//   affiliation is membership logic reserved for the next Tattvapeetha
//   sprint, not a field on this foundation record.
// — Exactly one Tattvapeetha entity may exist per institution (UNIQUE on
//   institution_id).
// — ON DELETE RESTRICT: deleting a Tattvapeetha entity never deletes the
//   institution. Deleting the institution while a Tattvapeetha entity
//   references it is blocked by the DB — the Institution Identity
//   Foundation is left completely unmodified by this sprint.
export const tattvapeethaEntities = pgTable('tattvapeetha_entities', {
  id: uuid('id').primaryKey().defaultRandom(),

  institutionId: uuid('institution_id')
    .notNull()
    .unique()
    .references(() => institutions.id, { onDelete: 'restrict' }),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});
