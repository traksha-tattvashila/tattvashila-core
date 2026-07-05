import {
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from 'drizzle-orm/pg-core';

// ─── Constitutional identity state ──────────────────────────────────────────
// The only two valid constitutional identity states.
// Operational states (PENDING, ACTIVE, etc.) live in processingState below.
export const identityState = pgEnum('identity_state', ['TMP', 'TRK']);

// ─── Operational processing state ───────────────────────────────────────────
// Engine-facing states that describe WHAT is being processed.
// These are not constitutional identity states.
// New operational states must be added here via migration — arbitrary strings
// are not permitted.
export const processingState = pgEnum('processing_state', [
  'PENDING',
  'ACTIVE',
  'SUSPENDED',
]);

// ─── Verified contact type ───────────────────────────────────────────────────
// The types of contact attributes that can be verified and linked to an identity.
export const contactType = pgEnum('contact_type', ['phone', 'email']);

// ─── Core identity record ────────────────────────────────────────────────────
// Represents WHO the person is constitutionally.
// The UUID primary key is the constitutional identity — not any contact attribute.
// One record per person. Only identity_state changes on TMP → TRK transition;
// no new record is ever created.
export const identities = pgTable(
  'identities',
  {
    id: uuid('id').primaryKey().defaultRandom(),

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

// ─── Verified contacts ───────────────────────────────────────────────────────
// Stores contact attributes (phone, email) after they have been verified.
// A contact attribute is not the identity — it is evidence that links a
// verified communication channel to an identity record.
//
// UNIQUE(contact_type, contact_value) enforces the constitutional rule that
// one phone number and one email address can each belong to at most one identity.
// This prevents duplicate identity creation through the same contact channel
// without making the contact attribute the identity itself.
export const identityVerifiedContacts = pgTable(
  'identity_verified_contacts',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),

    contactType: contactType('contact_type').notNull(),

    // Stored in normalised form (E.164 for phone, lowercase for email).
    // Normalisation is enforced by the application layer.
    contactValue: text('contact_value').notNull(),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    // One contact value per type across the entire system.
    // Prevents two identities from sharing the same phone or email.
    contactTypeValueUnique: unique(
      'identity_verified_contacts_type_value_unique',
    ).on(table.contactType, table.contactValue),

    identityIdIdx: index('identity_verified_contacts_identity_id_idx').on(
      table.identityId,
    ),
  }),
);

// ─── Operational metadata ────────────────────────────────────────────────────
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

    processingState: processingState('processing_state')
      .notNull()
      .default('PENDING'),

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
