import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// Constitutional identity state enum.
// These are the only two valid constitutional identity states.
// Operational states (PENDING, VERIFIED, etc.) belong to identity_operational_metadata.
export const identityState = pgEnum('identity_state', ['TMP', 'TRK']);

// Core identity record.
// Represents WHO the person is constitutionally.
// One record per person — persists unchanged through the TMP → TRK transition.
// Only identity_state changes on transition; no new record is ever created.
//
// phone_number is the natural key enforcing one row per person at the database level.
// Format normalisation (E.164) is enforced by the application layer.
export const identities = pgTable(
  'identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    // Natural person key. Unique across all identity records.
    // Prevents duplicate identity creation for the same person.
    phoneNumber: text('phone_number').notNull().unique(),

    identityState: identityState('identity_state').notNull().default('TMP'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    identityStateIdx: index('identities_identity_state_idx').on(
      table.identityState,
    ),
  }),
);

// Operational metadata record.
// Represents WHAT the processing engine is tracking for a given identity.
// Strictly separated from constitutional identity state by design.
// One record per identity, enforced by the unique constraint on identity_id.
export const identityOperationalMetadata = pgTable(
  'identity_operational_metadata',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),

    // Engine-facing processing state (e.g. PENDING, VERIFIED).
    // This is not a constitutional identity state.
    processingState: text('processing_state').notNull(),

    // Optional free-text reason recorded by the engine at state transition.
    stateReason: text('state_reason'),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    identityIdUnique: unique(
      'identity_operational_metadata_identity_id_unique',
    ).on(table.identityId),

    identityIdIdx: index('identity_operational_metadata_identity_id_idx').on(
      table.identityId,
    ),
  }),
);
