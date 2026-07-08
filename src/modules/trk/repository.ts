import { and, eq, sql } from 'drizzle-orm';

import { AppError } from '../../infrastructure/errors/app-error.js';
import type { DatabaseClient } from '../../infrastructure/database/client.js';
import type { ContactType, Identity } from './models.js';
import { generateTmpId, generateTrkId } from './public-id/generator.js';
import {
  identities,
  identityOperationalMetadata,
  identityVerifiedContacts,
  publicIdentifiers,
} from './schema.js';

// ─── Created identity ─────────────────────────────────────────────────────────
// Minimal shape returned after TMP issuance. `publicId` is the newly-issued
// constitutional public identifier for the identity.
export interface CreatedIdentity {
  readonly id: string;
  readonly state: string;
  readonly publicId: string;
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
  // records, initial operational metadata, and TMP public identifier inside a
  // single transaction. Either all writes succeed or none are written — there
  // is no partial identity creation.
  //
  // Throws AppError('CONTACT_ALREADY_REGISTERED', 409) if either contact
  // value is already linked to an existing identity.
  createIdentityWithContacts(params: {
    phone: string; // E.164 — normalised by the caller
    email: string; // lowercase — normalised by the caller
  }): Promise<CreatedIdentity>;

  // Retrieves a full identity read model (state, public identifier, verified
  // contacts, timestamps) by its constitutional UUID.
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
  //
  // On a successful transition, the TMP public identifier is archived and a
  // new, independently-generated TRK public identifier is issued — all
  // inside the same transaction. The TMP identifier is preserved in the
  // public_identifiers table (archived, never deleted) so it can never be
  // reissued to another identity.
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

// ─── Collision-resistant public identifier insertion ──────────────────────────
// Generates a public identifier and inserts it. If the generated value
// collides with an existing one (unique violation on public_id), a new value
// is generated and the insert is retried up to MAX_RETRIES times.
//
// Collision probability for a 16-character uppercase-alphanumeric identifier
// is 1 / 36^16 (≈ 4.7 × 10^−25) per attempt — retries exist as a
// constitutional safeguard, not as a realistic code path.
//
// This function is always called from inside a db.transaction() callback.
// A plain INSERT failure inside a PostgreSQL transaction aborts the whole
// transaction, making subsequent statements fail with "current transaction is
// aborted" rather than retrying cleanly. Each attempt is therefore wrapped in
// a savepoint: on unique violation, ROLLBACK TO SAVEPOINT restores the
// transaction to a usable state before the next iteration.
const MAX_PUBLIC_ID_RETRIES = 5;

type Insertable = Pick<DatabaseClient, 'insert' | 'execute'>;

async function insertPublicIdWithRetry(
  executor: Insertable,
  identityId: string,
  family: 'TMP' | 'TRK' | 'INS',
  generate: () => string,
): Promise<string> {
  for (let attempt = 1; attempt <= MAX_PUBLIC_ID_RETRIES; attempt++) {
    const publicId = generate();
    const sp = `pub_id_retry_${attempt}`;
    await executor.execute(sql.raw(`SAVEPOINT ${sp}`));
    try {
      await executor.insert(publicIdentifiers).values({
        identityId,
        publicId,
        idFamily: family,
        isActive: true,
      });
      await executor.execute(sql.raw(`RELEASE SAVEPOINT ${sp}`));
      return publicId;
    } catch (error) {
      // Roll back to the savepoint so the outer transaction remains usable
      // for the next attempt or for any writes that follow a re-throw.
      await executor.execute(sql.raw(`ROLLBACK TO SAVEPOINT ${sp}`));
      if (isUniqueViolation(error) && attempt < MAX_PUBLIC_ID_RETRIES) {
        continue;
      }
      // All retries exhausted on collision, or a non-collision error.
      throw isUniqueViolation(error)
        ? new AppError(
            'Failed to generate a unique public identifier after maximum retries.',
            'PUBLIC_ID_GENERATION_FAILED',
            500,
          )
        : error;
    }
  }
  // TypeScript cannot prove the loop always returns or throws — unreachable.
  throw new AppError(
    'Failed to generate a unique public identifier after maximum retries.',
    'PUBLIC_ID_GENERATION_FAILED',
    500,
  );
}

// ─── Shared row-select query ───────────────────────────────────────────────────
// Joins identities, their verified contacts, and the single active public
// identifier. Used both outside a transaction (findById) and inside one
// (transitionToTrk, which must read the post-update row within the same
// transaction). `Queryable` captures the minimal `select` surface shared by
// DatabaseClient and its transaction handle.
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
      publicId: publicIdentifiers.publicId,
    })
    .from(identities)
    .leftJoin(
      identityVerifiedContacts,
      eq(identityVerifiedContacts.identityId, identities.id),
    )
    .leftJoin(
      publicIdentifiers,
      and(
        eq(publicIdentifiers.identityId, identities.id),
        eq(publicIdentifiers.isActive, true),
      ),
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

          // 4. Issue the TMP constitutional public identifier.
          //    Collision retry is handled inside insertPublicIdWithRetry.
          //    All four writes are part of the same transaction — if any
          //    fails, none are committed.
          const publicId = await insertPublicIdWithRetry(
            tx,
            identity.id,
            'TMP',
            generateTmpId,
          );

          return { id: identity.id, state: identity.state, publicId };
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
          // Archive the current TMP public identifier.
          // The archived row is never deleted — it is permanently preserved
          // so the TMP value can never be reissued to any other identity.
          const now = new Date();
          await tx
            .update(publicIdentifiers)
            .set({ isActive: false, archivedAt: now })
            .where(
              and(
                eq(publicIdentifiers.identityId, id),
                eq(publicIdentifiers.isActive, true),
              ),
            );

          // Issue a new, independently-generated TRK public identifier.
          // generateTrkId() is called fresh — it has no relationship to the
          // TMP identifier that was just archived.
          await insertPublicIdWithRetry(tx, id, 'TRK', generateTrkId);

          // Read the post-transition identity using the same transaction so
          // the returned model reflects the new TRK state and public ID.
          const rows = await selectIdentityRows(tx, id);
          const identity = rowsToIdentity(rows);

          if (!identity) {
            // Unreachable: the UPDATE above confirmed the row exists and
            // matched within the same transaction.
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
// Shape of a single joined row from the selectIdentityRows() query above.
interface IdentityContactRow {
  id: string;
  state: string;
  createdAt: Date;
  updatedAt: Date;
  contactType: ContactType | null;
  contactValue: string | null;
  publicId: string | null;
}

// Collapses the joined identity+contacts+publicIdentifier rows into a single
// Identity read model. A left join means an identity with zero contacts still
// returns one row (with null contact columns), so the empty-contacts case is
// handled naturally rather than as a special case.
//
// `publicId` is non-null for every identity created from Sprint 12 onward.
// If it is null (pre-Sprint-12 row without a public identifier), the method
// throws rather than silently returning an incomplete model.
function rowsToIdentity(rows: IdentityContactRow[]): Identity | undefined {
  const first = rows[0];
  if (!first) return undefined;

  if (first.publicId === null) {
    throw new AppError(
      'Identity is missing a public identifier. This identity predates Sprint 12 and must be reissued.',
      'MISSING_PUBLIC_ID',
      500,
    );
  }

  const contacts = rows
    .filter(
      (row): row is IdentityContactRow & { contactType: ContactType; contactValue: string } =>
        row.contactType !== null && row.contactValue !== null,
    )
    .map((row) => ({ type: row.contactType, value: row.contactValue }));

  return {
    id: first.id,
    state: first.state,
    publicId: first.publicId,
    contacts,
    createdAt: first.createdAt,
    updatedAt: first.updatedAt,
  };
}
