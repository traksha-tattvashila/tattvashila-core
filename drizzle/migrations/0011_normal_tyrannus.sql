CREATE TYPE "public"."tattvaloka_progress_status" AS ENUM('in_progress', 'completed');--> statement-breakpoint
CREATE TABLE "tattvaloka_progress_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"membership_id" uuid NOT NULL,
	"unit_version_id" uuid NOT NULL,
	"status" "tattvaloka_progress_status" NOT NULL,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattvaloka_progress_records_membership_id_unit_version_id_unique" UNIQUE("membership_id","unit_version_id")
);
--> statement-breakpoint
ALTER TABLE "tattvaloka_progress_records" ADD CONSTRAINT "tattvaloka_progress_records_membership_id_tattvaloka_memberships_id_fk" FOREIGN KEY ("membership_id") REFERENCES "public"."tattvaloka_memberships"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tattvaloka_progress_records" ADD CONSTRAINT "tattvaloka_progress_records_unit_version_id_tattvaloka_content_unit_versions_id_fk" FOREIGN KEY ("unit_version_id") REFERENCES "public"."tattvaloka_content_unit_versions"("id") ON DELETE restrict ON UPDATE no action;