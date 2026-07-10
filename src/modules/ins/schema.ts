import {
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── Institution identity record ──────────────────────────────────────────────
// Represents an institution's constitutional identity.
// UUID is the permanent internal identity — it never changes and is never
// exposed as the public-facing identifier.
//
// INS identifier rules (constitutionally frozen, Sprint 12):
// • Format: INS-XXXXXXXXXXXX (12 uppercase alphanumeric characters)
// • Generated independently at registration — never derived from anything else
// • Immutable — never updated, archived, or reissued
// • Stored directly on this record — no join table required for an
//   immutable single-lifetime identifier (unlike TMP/TRK which transition)
//
// The UNIQUE constraint on ins_id enforces that no INS value is ever issued
// to more than one institution, even after the issuing institution is deleted
// (which is prohibited by any FK RESTRICT referencing this table).
export const institutions = pgTable(
  'institutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    name: text('name').notNull(),

    // Constitutional public identifier for this institution.
    // Set once at registration. Never null, never updated.
    insId: text('ins_id').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    // Global uniqueness — no INS value is ever reissued.
    insIdUnique: unique('institutions_ins_id_unique').on(table.insId),

    // Supports O(1) discovery lookup by INS identifier.
    insIdIdx: index('institutions_ins_id_idx').on(table.insId),
  }),
);
