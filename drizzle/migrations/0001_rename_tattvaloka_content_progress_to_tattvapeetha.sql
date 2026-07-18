-- Migration: rename Tattvaloka content, progress, and discovery tables to Tattvapeetha
--
-- These tables were originally created under the tattvaloka_ prefix during
-- Sprints 17–19 but constitutionally belong to the Tattvapeetha module.
-- This migration renames them to their correct tattvapeetha_ prefix.
--
-- ⚠️  REVIEW BEFORE APPLYING — do not apply this migration to a live database
--     without understanding the full impact on any clients that query these
--     tables directly by name. Application-layer references have already been
--     updated in the codebase to use the new names.
--
-- Safe to apply: no data is lost, no columns are changed, no rows are touched.
-- All changes are pure renames.

-- 1. Rename enum types
ALTER TYPE "tattvaloka_content_status" RENAME TO "tattvapeetha_content_status";
ALTER TYPE "tattvaloka_progress_status" RENAME TO "tattvapeetha_progress_status";

-- 2. Rename tables (order follows FK dependencies: parents before children)
ALTER TABLE "tattvaloka_content_paths"        RENAME TO "tattvapeetha_content_paths";
ALTER TABLE "tattvaloka_content_modules"      RENAME TO "tattvapeetha_content_modules";
ALTER TABLE "tattvaloka_content_units"        RENAME TO "tattvapeetha_content_units";
ALTER TABLE "tattvaloka_content_unit_versions" RENAME TO "tattvapeetha_content_unit_versions";
ALTER TABLE "tattvaloka_progress_records"     RENAME TO "tattvapeetha_progress_records";

-- 3. Rename unique constraints
ALTER TABLE "tattvapeetha_content_unit_versions"
  RENAME CONSTRAINT "tattvaloka_content_unit_versions_unit_id_version_number_unique"
  TO "tattvapeetha_content_unit_versions_unit_id_version_number_unique";

ALTER TABLE "tattvapeetha_progress_records"
  RENAME CONSTRAINT "tattvaloka_progress_records_membership_id_unit_version_id_unique"
  TO "tattvapeetha_progress_records_membership_id_unit_version_id_unique";

-- 4. Rename the partial unique index (one current version per unit)
ALTER INDEX "tattvaloka_content_unit_versions_one_current_per_unit"
  RENAME TO "tattvapeetha_content_unit_versions_one_current_per_unit";
