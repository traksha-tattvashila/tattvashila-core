-- Migration: re-anchor tattvapeetha_progress_records from membership_id to identity_id
--
-- Progress records were originally anchored to a Tattvaloka membership record.
-- This migration removes that cross-module dependency: records now anchor
-- directly to the identity (identities.id), independent of any membership.
--
-- ⚠️  REVIEW BEFORE APPLYING
--     If any rows already exist in tattvapeetha_progress_records, the
--     membership_id → identity_id back-fill must be done before the NOT NULL
--     constraint is added. In a fresh database (no rows yet) the migration
--     runs as-is. If you have existing rows, populate identity_id from the
--     tattvaloka_memberships.identity_id column before step 4.
--
-- Safe to apply on an empty table with no data loss.

-- 1. Drop the old unique constraint on (membership_id, unit_version_id)
ALTER TABLE "tattvapeetha_progress_records"
  DROP CONSTRAINT IF EXISTS
    "tattvapeetha_progress_records_membership_id_unit_version_id_unique";

-- 2. Drop the old foreign key on membership_id
--    (PostgreSQL names FK constraints automatically; adjust if yours differs)
ALTER TABLE "tattvapeetha_progress_records"
  DROP CONSTRAINT IF EXISTS
    "tattvapeetha_progress_records_membership_id_tattvaloka_member";

-- 3. Drop the old column
ALTER TABLE "tattvapeetha_progress_records"
  DROP COLUMN IF EXISTS "membership_id";

-- 4. Add the new identity_id column (nullable first to allow back-fill if needed)
ALTER TABLE "tattvapeetha_progress_records"
  ADD COLUMN "identity_id" UUID
    REFERENCES "identities"("id") ON DELETE RESTRICT;

-- 5. If you have existing rows, back-fill identity_id here before proceeding.
--    Example (only needed if rows exist):
--    UPDATE "tattvapeetha_progress_records" pr
--    SET identity_id = m.identity_id
--    FROM "tattvaloka_memberships" m
--    WHERE pr.membership_id = m.id;

-- 6. Make identity_id NOT NULL now that every row has a value
ALTER TABLE "tattvapeetha_progress_records"
  ALTER COLUMN "identity_id" SET NOT NULL;

-- 7. Add the new unique constraint on (identity_id, unit_version_id)
ALTER TABLE "tattvapeetha_progress_records"
  ADD CONSTRAINT
    "tattvapeetha_progress_records_identity_id_unit_version_id_unique"
  UNIQUE ("identity_id", "unit_version_id");
