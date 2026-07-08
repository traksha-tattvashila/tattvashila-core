---
name: Public identifier design
description: TMP/TRK/INS generation, collision retry, archival pattern, and UUID-vs-publicId boundary decision for constitutional public identifiers.
---

# Public identifier design

## The rule
UUID is the internal constitutional identity. TMP/TRK/INS are public-facing identifiers stored in `public_identifiers`. The two must not be mixed; UUID must not be the primary external handle.

**Why:** Constitutional amendment — "UUIDs are never exposed as the primary public identity."

**How to apply:** Every API surface addressing an identity externally should accept/return `publicId`, not UUID. Current routes (`GET /identities/:id`, `POST /identities/:id/transition-to-trk`) still use UUID as route param — this is a known gap tracked for a future sprint.

## Generation
- File: `src/modules/trk/public-id/generator.ts`
- Alphabet: A-Z + 0-9 (36 chars). Rejection sampling (reject bytes ≥ 252) eliminates modulo bias.
- TMP: `TMP-` + 16 chars. TRK: `TRK-` + 16 chars. INS: `INS-` + 12 chars.
- TRK is always generated fresh — never derived from the TMP value being archived.

## Storage
- Table: `public_identifiers`
- Key constraints: `public_id` UNIQUE (prevents reissue forever, even for archived rows). Partial unique index `ON (identity_id) WHERE is_active = true` enforces at most one active identifier per identity at the DB level.
- `is_active=false` + `archived_at` set when superseded (TMP → TRK). Archived rows are never deleted.

## Collision retry
- `insertPublicIdWithRetry` in `repository.ts` catches PG error 23505 on `public_id` and retries up to 5× with a freshly generated value.
- Runs inside the same transaction as the identity write — no partial commits.

## TMP → TRK pattern (single transaction)
1. Conditional UPDATE identities: `identity_state = 'TRK' WHERE identity_state = 'TMP'`
2. Archive TMP: UPDATE public_identifiers SET `is_active=false, archived_at=now()` WHERE `identity_id=? AND is_active=true`
3. Issue TRK: `insertPublicIdWithRetry` with `generateTrkId`
4. Re-read via `selectIdentityRows` (same tx) to return the post-transition model

## Backfill pattern
- Identities created before this feature have no public_identifiers row and throw MISSING_PUBLIC_ID (500) on read.
- Migration backfills them using a temporary PL/pgSQL helper with `random()` (acceptable for dev-era data; production issuance uses crypto.randomBytes in the app layer).
- `rowsToIdentity` deliberately throws on null publicId to catch any missed rows.
