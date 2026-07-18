import { sql } from 'drizzle-orm';
import {
  boolean,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  unique,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core';

import { institutions } from '../ins/schema.js';
import { identities } from '../trk/schema.js';

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

// ─── Tattvapeetha content status ───────────────────────────────────────────────
// Closed constitutional enumeration governing the lifecycle of every content
// entity in the hierarchy (path, module, unit). Transitions are one-directional:
// draft → published, draft → retired, published → retired. Retired is terminal.
export const tattvapeethaContentStatus = pgEnum('tattvapeetha_content_status', [
  'draft',
  'published',
  'retired',
]);

// ─── Tattvapeetha content paths ─────────────────────────────────────────────────
// Top level of the fixed three-level content hierarchy: Path → Module → Unit.
// A content path is a purely organisational container — it holds no
// substantive content of its own.
//
// Constitutional rules:
// — Hierarchy depth is fixed at three levels and must not be restructured
//   without a constitutional amendment sprint.
// — contentKey is an immutable, human-referenceable identifier. It is
//   structurally distinct from a raw UUID and from the TMP/TRK/INS public
//   identifier standard — it is never reused as a constitutional identity.
export const tattvapeethaContentPaths = pgTable('tattvapeetha_content_paths', {
  id: uuid('id').primaryKey().defaultRandom(),

  contentKey: text('content_key').notNull().unique(),

  title: text('title').notNull(),

  status: tattvapeethaContentStatus('status').notNull().default('draft'),

  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Tattvapeetha content modules ───────────────────────────────────────────────
// Second level of the content hierarchy. Every module belongs to exactly one
// path. Like paths, modules are organisational containers only.
//
// — ON DELETE RESTRICT: a path may never be deleted while a module still
//   references it.
export const tattvapeethaContentModules = pgTable('tattvapeetha_content_modules', {
  id: uuid('id').primaryKey().defaultRandom(),

  pathId: uuid('path_id')
    .notNull()
    .references(() => tattvapeethaContentPaths.id, { onDelete: 'restrict' }),

  contentKey: text('content_key').notNull().unique(),

  title: text('title').notNull(),

  status: tattvapeethaContentStatus('status').notNull().default('draft'),

  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Tattvapeetha content units ─────────────────────────────────────────────────
// Third (leaf) level of the content hierarchy. A unit is the persistent,
// immutable anchor that future progress records reference — its identity
// never changes even as its substance is revised through new versions
// (see tattvapeethaContentUnitVersions below).
//
// — ON DELETE RESTRICT: a module may never be deleted while a unit still
//   references it.
// — A unit holds no substantive content itself; substance lives exclusively
//   in its versions.
export const tattvapeethaContentUnits = pgTable('tattvapeetha_content_units', {
  id: uuid('id').primaryKey().defaultRandom(),

  moduleId: uuid('module_id')
    .notNull()
    .references(() => tattvapeethaContentModules.id, { onDelete: 'restrict' }),

  contentKey: text('content_key').notNull().unique(),

  status: tattvapeethaContentStatus('status').notNull().default('draft'),

  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Tattvapeetha content unit versions ─────────────────────────────────────────
// The substantive content of a unit. A version is created, never mutated —
// revising a unit's content always creates a new version row; no published
// version's title or body is ever changed in place.
//
// Constitutional rules:
// — Retired content units must remain permanently resolvable: version rows
//   are never deleted, regardless of the owning unit's status.
// — versionNumber is sequential per unit, starting at 1, and immutable once
//   assigned (enforced by the unique constraint below).
// — isCurrent identifies the version presently associated with the unit.
//   Exactly one version per unit may be current at a time (enforced by the
//   partial unique index below). Flipping isCurrent when a new version is
//   created is the only mutation ever applied to an existing version row —
//   title and body are fixed permanently at creation.
export const tattvapeethaContentUnitVersions = pgTable(
  'tattvapeetha_content_unit_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    unitId: uuid('unit_id')
      .notNull()
      .references(() => tattvapeethaContentUnits.id, { onDelete: 'restrict' }),

    versionNumber: integer('version_number').notNull(),

    title: text('title').notNull(),

    body: text('body').notNull(),

    isCurrent: boolean('is_current').notNull().default(false),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    unitVersionNumberUnique: unique(
      'tattvapeetha_content_unit_versions_unit_id_version_number_unique',
    ).on(table.unitId, table.versionNumber),

    // Database-level enforcement that each unit has at most one current
    // version at any time. The WHERE clause makes this a partial unique
    // index: historical, non-current versions are excluded so a unit can
    // accumulate any number of retired versions without conflict.
    oneCurrentPerUnit: uniqueIndex(
      'tattvapeetha_content_unit_versions_one_current_per_unit',
    )
      .on(table.unitId)
      .where(sql`${table.isCurrent} = true`),
  }),
);

// ─── Tattvapeetha progress status ───────────────────────────────────────────────
// Closed constitutional enumeration for unit-level completion. "not-started"
// is intentionally not a stored value — it is the implicit state when no
// progress record exists for a given membership/content-version pair.
export const tattvapeethaProgressStatus = pgEnum('tattvapeetha_progress_status', [
  'in_progress',
  'completed',
]);

// ─── Tattvapeetha progress records ──────────────────────────────────────────────
// Records an identity's advancement through a specific, immutable content unit
// version. Anchored to the identity directly (never to a membership record
// from another module) and to a content unit *version* (Sprint 17), never to
// the mutable unit — preserving exactly which substance the identity engaged
// with.
//
// Constitutional rules:
// — Exactly one progress record may exist per (identity, unit version)
//   pair (UNIQUE on identity_id + unit_version_id).
// — ON DELETE RESTRICT on both foreign keys: an identity or content version
//   may never be deleted while a progress record still references it.
// — A progress record is never deleted when its referenced version is
//   superseded or its owning unit is retired — it remains permanently
//   resolvable, satisfying historical accuracy.
// — Aggregate progress is always computed from these records; no aggregate
//   total is ever persisted here or elsewhere.
export const tattvapeethaProgressRecords = pgTable(
  'tattvapeetha_progress_records',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    identityId: uuid('identity_id')
      .notNull()
      .references(() => identities.id, { onDelete: 'restrict' }),

    unitVersionId: uuid('unit_version_id')
      .notNull()
      .references(() => tattvapeethaContentUnitVersions.id, { onDelete: 'restrict' }),

    status: tattvapeethaProgressStatus('status').notNull(),

    startedAt: timestamp('started_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    completedAt: timestamp('completed_at', { withTimezone: true }),

    createdAt: timestamp('created_at', { withTimezone: true })
      .notNull()
      .defaultNow(),

    updatedAt: timestamp('updated_at', { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdateFn(() => new Date()),
  },
  (table) => ({
    oneRecordPerIdentityVersion: unique(
      'tattvapeetha_progress_records_identity_id_unit_version_id_unique',
    ).on(table.identityId, table.unitVersionId),
  }),
);
