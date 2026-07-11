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

// ─── Tattvaloka content status ─────────────────────────────────────────────────
// Closed constitutional enumeration governing the lifecycle of every content
// entity in the hierarchy (path, module, unit). Transitions are one-directional:
// draft → published, draft → retired, published → retired. Retired is terminal.
export const tattvalokaContentStatus = pgEnum('tattvaloka_content_status', [
  'draft',
  'published',
  'retired',
]);

// ─── Tattvaloka content paths ───────────────────────────────────────────────────
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
export const tattvalokaContentPaths = pgTable('tattvaloka_content_paths', {
  id: uuid('id').primaryKey().defaultRandom(),

  contentKey: text('content_key').notNull().unique(),

  title: text('title').notNull(),

  status: tattvalokaContentStatus('status').notNull().default('draft'),

  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Tattvaloka content modules ─────────────────────────────────────────────────
// Second level of the content hierarchy. Every module belongs to exactly one
// path. Like paths, modules are organisational containers only.
//
// — ON DELETE RESTRICT: a path may never be deleted while a module still
//   references it.
export const tattvalokaContentModules = pgTable('tattvaloka_content_modules', {
  id: uuid('id').primaryKey().defaultRandom(),

  pathId: uuid('path_id')
    .notNull()
    .references(() => tattvalokaContentPaths.id, { onDelete: 'restrict' }),

  contentKey: text('content_key').notNull().unique(),

  title: text('title').notNull(),

  status: tattvalokaContentStatus('status').notNull().default('draft'),

  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Tattvaloka content units ───────────────────────────────────────────────────
// Third (leaf) level of the content hierarchy. A unit is the persistent,
// immutable anchor that future progress records (Sprint 18) will reference —
// its identity never changes even as its substance is revised through new
// versions (see tattvalokaContentUnitVersions below).
//
// — ON DELETE RESTRICT: a module may never be deleted while a unit still
//   references it.
// — A unit holds no substantive content itself; substance lives exclusively
//   in its versions.
export const tattvalokaContentUnits = pgTable('tattvaloka_content_units', {
  id: uuid('id').primaryKey().defaultRandom(),

  moduleId: uuid('module_id')
    .notNull()
    .references(() => tattvalokaContentModules.id, { onDelete: 'restrict' }),

  contentKey: text('content_key').notNull().unique(),

  status: tattvalokaContentStatus('status').notNull().default('draft'),

  position: integer('position').notNull().default(0),

  createdAt: timestamp('created_at', { withTimezone: true })
    .notNull()
    .defaultNow(),

  updatedAt: timestamp('updated_at', { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdateFn(() => new Date()),
});

// ─── Tattvaloka content unit versions ───────────────────────────────────────────
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
export const tattvalokaContentUnitVersions = pgTable(
  'tattvaloka_content_unit_versions',
  {
    id: uuid('id').primaryKey().defaultRandom(),

    unitId: uuid('unit_id')
      .notNull()
      .references(() => tattvalokaContentUnits.id, { onDelete: 'restrict' }),

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
      'tattvaloka_content_unit_versions_unit_id_version_number_unique',
    ).on(table.unitId, table.versionNumber),

    // Database-level enforcement that each unit has at most one current
    // version at any time. The WHERE clause makes this a partial unique
    // index: historical, non-current versions are excluded so a unit can
    // accumulate any number of retired versions without conflict.
    oneCurrentPerUnit: uniqueIndex(
      'tattvaloka_content_unit_versions_one_current_per_unit',
    )
      .on(table.unitId)
      .where(sql`${table.isCurrent} = true`),
  }),
);
