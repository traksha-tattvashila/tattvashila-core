import { sql } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

// Note: processing_state is intentionally TEXT, not an enum.
// Operational states are not constitutionally finalized; an enum would
// prematurely freeze the lifecycle and force DB migrations for every
// operational state change during Sprint 4 development.

// ─── Constitutional identity state ──────────────────────────────────────────
// The only two valid constitutional identity states.
// Operational states (PENDING, ACTIVE, etc.) live in processingState below.
export const identityState = pgEnum('identity_state', ['TMP', 'TRK']);

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

// ─── Public identifier family ─────────────────────────────────────────────────
// Discriminates the three constitutional public identifier families.
// INS is included here for schema completeness; institution registration is
// out of scope for this sprint and will be wired in a future amendment.
export const idFamily = pgEnum('id_family', ['TMP', 'TRK', 'INS']);

// ─── Public identifiers ───────────────────────────────────────────────────────
// Stores the constitutional public identifiers issued to an identity.
//
// One record is active (is_active = true) at any given time per identity.
// On TMP → TRK transition the TMP record is archived (is_active set to false,
// archived_at recorded) and a new TRK record is inserted — two separate writes,
// both inside the same transaction that updates identity_state.
//
// Constitutional invariants enforced here:
// • publicId UNIQUE — no identifier is ever reissued, even after archival.
// • identityId FK RESTRICT — a public identifier cannot outlive its identity.
// • Archived rows are never deleted — the history is permanent.
export const publicIdentifiers = pgTable(
  'public_identifiers',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),

    // The full formatted public identifier (e.g. "TMP-7Q2M8KPX91AR6WZT").
    // UNIQUE enforces that no value is ever reissued — even archived ones.
    publicId: text('public_id').notNull(),

    idFamily: idFamily('id_family').notNull(),

    // false once the identifier has been superseded (TMP → TRK transition).
    // An identity always has exactly one active public identifier.
    isActive: boolean('is_active').notNull().default(true),

    // Set to the transition timestamp when the identifier is archived.
    // null for any currently-active identifier.
    archivedAt: timestamp('archived_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => ({
    // Enforces global uniqueness — no public identifier is ever reused.
    publicIdUnique: unique('public_identifiers_public_id_unique').on(
      table.publicId,
    ),

    identityIdIdx: index('public_identifiers_identity_id_idx').on(
      table.identityId,
    ),

    // Database-level enforcement that each identity has at most one active
    // public identifier at any time. The WHERE clause makes this a partial
    // unique index: archived rows (is_active = false) are excluded so the
    // same identity can accumulate a TMP and a TRK record without conflict.
    oneActivePerIdentity: uniqueIndex(
      'public_identifiers_one_active_per_identity',
    )
      .on(table.identityId)
      .where(sql`${table.isActive} = true`),
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
