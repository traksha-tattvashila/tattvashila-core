import { and, eq } from 'drizzle-orm';

import { AppError } from '../../infrastructure/errors/app-error.js';
import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { ContactType, Identity } from './models.js';
import {
  identities,
  identityOperationalMetadata,
  identityVerifiedContacts,
} from './schema.js';

// ─── Created identity ─────────────────────────────────────────────────────────
export interface CreatedIdentity {
  readonly id: string;
  readonly state: string;
}

// ─── TRK transition outcome ────────────────────────────────────────────────────
// The repository never throws domain errors — it reports what happened so
// the transition service can decide how to surface it. This keeps the
// repository persistence-only while still allowing the caller to
// distinguish "no such identity" from "already transitioned" without a
// second round trip.
export type TransitionToTrkOutcome =
  | { readonly kind: 'NOT_FOUND' }
  | { readonly kind: 'ALREADY_TRK' }
  | { readonly kind: 'TRANSITIONED'; readonly identity: Identity };

// ─── TRK repository interface ─────────────────────────────────────────────────
export interface TrkRepository {
  // Creates a constitutional TMP identity together with its verified contact
  // records and initial operational metadata inside a single transaction.
  // Either all three inserts succeed or none are written — there is no
  // partial identity creation.
  //
  // Throws AppError('CONTACT_ALREADY_REGISTERED', 409) if either contact
  // value is already linked to an existing identity.
  createIdentityWithContacts(params: {
    phone: string; // E.164 — normalised by the caller
    email: string; // lowercase — normalised by the caller
  }): Promise<CreatedIdentity>;

  // Retrieves a full identity read model (state, verified contacts,
  // timestamps) by its constitutional UUID.
  // Returns undefined if no identity exists with that id — callers decide
  // how to surface absence (the domain service maps this to IdentityError).
  findById(id: string): Promise<Identity | undefined>;

  // Retrieves a full identity read model by one of its verified contacts.
  // Returns undefined if no identity has a verified contact matching the
  // given type and value.
  findByVerifiedContact(
    contactType: ContactType,
    contactValue: string,
  ): Promise<Identity | undefined>;

  // Atomically transitions an identity from TMP to TRK.
  //
  // Implemented as a single conditional UPDATE (WHERE id = ? AND
  // identity_state = 'TMP') inside a transaction: PostgreSQL's row-level
  // locking on UPDATE ensures that if two requests race for the same
  // identity, only one can match the WHERE clause and succeed — the other
  // observes the already-updated row and reports ALREADY_TRK. No new
  // identity record is ever created and the UUID never changes; only
  // identity_state is written.
  transitionToTrk(id: string): Promise<TransitionToTrkOutcome>;
}

// ─── PostgreSQL error codes ───────────────────────────────────────────────────
const PG_UNIQUE_VIOLATION = '23505';

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Error &&
    'code' in error &&
    (error as { code?: string }).code === PG_UNIQUE_VIOLATION
  );
}

// ─── Shared row-select query ───────────────────────────────────────────────────
// The identity+contacts join is needed both outside a transaction (findById)
// and inside one (transitionToTrk, which must read the post-update row using
// the same transaction that wrote it). `Queryable` captures the minimal
// `select` surface shared by DatabaseClient and its transaction handle so
// the query can run against either.
type Queryable = Pick<DatabaseClient, 'select'>;

async function selectIdentityRows(
  executor: Queryable,
  id: string,
): Promise<IdentityContactRow[]> {
  return executor
    .select({
      id: identities.id,
      state: identities.identityState,
      createdAt: identities.createdAt,
      updatedAt: identities.updatedAt,
      contactType: identityVerifiedContacts.contactType,
      contactValue: identityVerifiedContacts.contactValue,
    })
    .from(identities)
    .leftJoin(
      identityVerifiedContacts,
      eq(identityVerifiedContacts.identityId, identities.id),
    )
    .where(eq(identities.id, id));
}

// ─── Repository factory ───────────────────────────────────────────────────────
export function createTrkRepository(db: DatabaseClient): TrkRepository {
  return {
    async createIdentityWithContacts({ phone, email }) {
      try {
        return await db.transaction(async (tx) => {
          // 1. Create the constitutional identity record (TMP by default).
          const identityRows = await tx
            .insert(identities)
            .values({ identityState: 'TMP' })
            .returning({
              id: identities.id,
              state: identities.identityState,
            });

          const identity = identityRows[0];
          if (!identity) {
            throw new AppError(
              'Identity creation failed: no row returned.',
              'DB_INSERT_FAILED',
              500,
            );
          }

          // 2. Create verified contact records for phone and email.
          await tx.insert(identityVerifiedContacts).values([
            {
              identityId: identity.id,
              contactType: 'phone',
              contactValue: phone,
            },
            {
              identityId: identity.id,
              contactType: 'email',
              contactValue: email,
            },
          ]);

          // 3. Create initial operational metadata.
          await tx.insert(identityOperationalMetadata).values({
            identityId: identity.id,
            processingState: 'PENDING',
          });

          return { id: identity.id, state: identity.state };
        });
      } catch (error) {
        if (isUniqueViolation(error)) {
          throw new AppError(
            'One or more contact values are already registered to another identity.',
            'CONTACT_ALREADY_REGISTERED',
            409,
          );
        }
        throw error;
      }
    },

    async findById(id) {
      const rows = await selectIdentityRows(db, id);
      return rowsToIdentity(rows);
    },

    async findByVerifiedContact(contactType, contactValue) {
      const contactRows = await db
        .select({ identityId: identityVerifiedContacts.identityId })
        .from(identityVerifiedContacts)
        .where(
          and(
            eq(identityVerifiedContacts.contactType, contactType),
            eq(identityVerifiedContacts.contactValue, contactValue),
          ),
        )
        .limit(1);

      const match = contactRows[0];
      if (!match) return undefined;

      return this.findById(match.identityId);
    },

    async transitionToTrk(id): Promise<TransitionToTrkOutcome> {
      return db.transaction(async (tx) => {
        // Single conditional UPDATE: only matches a row that is currently
        // TMP. This is the entire concurrency-safety mechanism — Postgres
        // takes a row lock for the duration of the UPDATE, so a second
        // concurrent transition attempt on the same id blocks until the
        // first commits, then evaluates the WHERE clause against the
        // now-TRK row and matches zero rows itself. No identity is ever
        // inserted and no other column is written.
        const updated = await tx
          .update(identities)
          .set({ identityState: 'TRK' })
          .where(
            and(eq(identities.id, id), eq(identities.identityState, 'TMP')),
          )
          .returning({ id: identities.id });

        if (updated.length > 0) {
          const rows = await selectIdentityRows(tx, id);
          const identity = rowsToIdentity(rows);

          if (!identity) {
            // Unreachable in practice: the UPDATE above just confirmed the
            // row exists and matched, within the same transaction.
            throw new AppError(
              'Identity transition failed: no row found after update.',
              'DB_UPDATE_FAILED',
              500,
            );
          }

          return { kind: 'TRANSITIONED', identity };
        }

        // The UPDATE matched nothing — either the identity does not exist
        // at all, or it exists but is not currently TMP (already TRK).
        // Distinguish the two without a second lock, since no write will
        // follow either way.
        const existingRows = await selectIdentityRows(tx, id);
        const existing = rowsToIdentity(existingRows);

        if (!existing) {
          return { kind: 'NOT_FOUND' };
        }

        return { kind: 'ALREADY_TRK' };
      });
    },
  };
}

// ─── Row mapping ───────────────────────────────────────────────────────────────
// Shape of a single joined row from the findById() query above.
interface IdentityContactRow {
  id: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  contactType: ContactType | null;
  contactValue: string | null;
}

// Collapses the joined identity+contacts rows into a single Identity read
// model. A left join means an identity with zero contacts still returns one
// row (with null contact columns), so the empty-contacts case is handled
// naturally rather than as a special case.
function rowsToIdentity(rows: IdentityContactRow[]): Identity | undefined {
  const first = rows[0];
  if (!first) return undefined;

  const contacts = rows
    .filter(
      (row): row is IdentityContactRow & { contactType: ContactType; contactValue: string } =>
        row.contactType !== null && row.contactValue !== null,
    )
    .map((row) => ({ type: row.contactType, value: row.contactValue }));

  return {
    id: first.id,
    state: first.state,
    contacts,
    createdAt: first.createdAt,
    updatedAt: first.updatedAt,
  };
}
