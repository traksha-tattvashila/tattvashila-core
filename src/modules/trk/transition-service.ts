import { IdentityError, IdentityErrorCode } from './errors.js';
import type { Identity } from './models.js';
import type { TrkRepository } from './repository.js';

// ─── TRK eligibility policy ───────────────────────────────────────────────────
// The minimum number of days an identity must have existed as TMP before it
// is eligible to transition to TRK. This is a time-based gate, not an
// activity-based one — the clock starts at TMP issuance and runs regardless
// of whether the person has posted or logged in.
const MINIMUM_TMP_DAYS = 15;

// ─── TRK transition service interface ────────────────────────────────────────
// The application-layer contract for upgrading a constitutional identity
// from TMP to TRK. Runs a pre-transition eligibility check (verified contacts
// + minimum waiting period) before delegating to the repository's atomic
// conditional update.
export interface TrkTransitionService {
  // Transitions the identity with the given UUID from TMP to TRK.
  //
  // Eligibility is checked before the state change is attempted:
  //   - The identity must have a verified phone contact.
  //   - The identity must have a verified email contact.
  //   - At least MINIMUM_TMP_DAYS must have elapsed since TMP issuance.
  //
  // Throws IdentityError(NOT_FOUND) if no identity exists with that id.
  // Throws IdentityError(PHONE_NOT_VERIFIED) if the phone check fails.
  // Throws IdentityError(EMAIL_NOT_VERIFIED) if the email check fails.
  // Throws IdentityError(WAITING_PERIOD_NOT_COMPLETE) if the age check fails.
  // Throws IdentityError(ALREADY_TRK) if the identity has already
  // transitioned — the database is left untouched in that case.
  // The identity's UUID never changes and no new identity is created;
  // this only ever updates the existing record's constitutional state.
  transitionToTrk(id: string): Promise<Identity>;
}

// ─── Factory ──────────────────────────────────────────────────────────────────
export function createTrkTransitionService(
  repository: TrkRepository,
): TrkTransitionService {
  return {
    async transitionToTrk(id: string): Promise<Identity> {
      // Load the full identity first so eligibility can be checked against
      // live database state before any write is attempted.
      const identity = await repository.findById(id);

      if (identity === undefined) {
        throw new IdentityError(
          'No identity exists with the given id.',
          IdentityErrorCode.NOT_FOUND,
        );
      }

      // ── Eligibility: verified phone ──────────────────────────────────────
      // A row in identity_verified_contacts with type 'phone' must exist.
      // This is written at TMP issuance time; its absence means the OTP
      // flow was never completed for this channel.
      const hasPhone = identity.contacts.some((c) => c.type === 'phone');
      if (!hasPhone) {
        throw new IdentityError(
          'Phone number has not been verified.',
          IdentityErrorCode.PHONE_NOT_VERIFIED,
        );
      }

      // ── Eligibility: verified email ──────────────────────────────────────
      const hasEmail = identity.contacts.some((c) => c.type === 'email');
      if (!hasEmail) {
        throw new IdentityError(
          'Email address has not been verified.',
          IdentityErrorCode.EMAIL_NOT_VERIFIED,
        );
      }

      // ── Eligibility: minimum waiting period ──────────────────────────────
      // The waiting period is measured from the identities.created_at
      // timestamp (set at TMP issuance) to now. It is purely time-based —
      // no activity, login count, or post count is considered.
      const now = new Date();
      const ageMs = now.getTime() - identity.createdAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays < MINIMUM_TMP_DAYS) {
        const remainingDays = Math.ceil(MINIMUM_TMP_DAYS - ageDays);
        throw new IdentityError(
          `Minimum waiting period not yet complete. ${remainingDays} day(s) remaining before TRK eligibility.`,
          IdentityErrorCode.WAITING_PERIOD_NOT_COMPLETE,
        );
      }

      // ── All checks passed — attempt the atomic state transition ──────────
      // There is a narrow TOCTOU window between findById and transitionToTrk;
      // the repository handles it: transitionToTrk is a conditional UPDATE
      // (WHERE identity_state = 'TMP') inside a transaction, so a race
      // between two concurrent requests resolves safely at the database level.
      const outcome = await repository.transitionToTrk(id);

      switch (outcome.kind) {
        case 'NOT_FOUND':
          throw new IdentityError(
            'No identity exists with the given id.',
            IdentityErrorCode.NOT_FOUND,
          );

        case 'ALREADY_TRK':
          throw new IdentityError(
            'Identity has already transitioned to TRK.',
            IdentityErrorCode.ALREADY_TRK,
          );

        case 'TRANSITIONED':
          return outcome.identity;
      }
    },
  };
}
