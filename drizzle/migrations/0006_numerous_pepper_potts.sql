DROP INDEX "public_identifiers_is_active_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "public_identifiers_one_active_per_identity" ON "public_identifiers" USING btree ("identity_id") WHERE "public_identifiers"."is_active" = true;--> statement-breakpoint

-- ─── Backfill: issue public identifiers to pre-existing identities ────────────
-- Any identity created before this migration has no public_identifiers row.
-- Without a backfill those identities would throw MISSING_PUBLIC_ID (500) on
-- every read. This migration issues a TMP or TRK identifier (matching the
-- identity's current constitutional state) to every such identity.
--
-- A temporary PL/pgSQL helper generates random uppercase-alphanumeric strings
-- (A–Z, 0–9). It uses random() rather than gen_random_bytes() because this
-- runs only on development/test data that predates the Sprint 12 production
-- issuance path; all production identities are issued via the application
-- layer which uses rejection-sampled crypto.randomBytes().
--
-- The helper is dropped at the end of the migration so it leaves no trace.

CREATE OR REPLACE FUNCTION _tmp_random_alphanum(len int) RETURNS text
LANGUAGE sql AS $$
  SELECT string_agg(
    substr('ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789', (floor(random() * 36) + 1)::int, 1),
    ''
  )
  FROM generate_series(1, len)
$$;

-- Backfill TMP identities (identity_state = 'TMP') that have no active public identifier.
INSERT INTO public_identifiers (identity_id, public_id, id_family, is_active)
SELECT
  i.id,
  'TMP-' || _tmp_random_alphanum(16),
  'TMP',
  true
FROM identities i
WHERE i.identity_state = 'TMP'
  AND NOT EXISTS (
    SELECT 1 FROM public_identifiers p
    WHERE p.identity_id = i.id AND p.is_active = true
  );

-- Backfill TRK identities (identity_state = 'TRK') that have no active public identifier.
INSERT INTO public_identifiers (identity_id, public_id, id_family, is_active)
SELECT
  i.id,
  'TRK-' || _tmp_random_alphanum(16),
  'TRK',
  true
FROM identities i
WHERE i.identity_state = 'TRK'
  AND NOT EXISTS (
    SELECT 1 FROM public_identifiers p
    WHERE p.identity_id = i.id AND p.is_active = true
  );

DROP FUNCTION _tmp_random_alphanum(int);
