import { AppError } from '../../infrastructure/errors/app-error.js';
import type { DatabaseClient } from '../../infrastructure/database/client.js';
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
  };
}
