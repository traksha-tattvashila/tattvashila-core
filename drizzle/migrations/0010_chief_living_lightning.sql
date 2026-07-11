CREATE TYPE "public"."tattvaloka_content_status" AS ENUM('draft', 'published', 'retired');--> statement-breakpoint
CREATE TABLE "tattvaloka_content_modules" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"path_id" uuid NOT NULL,
	"content_key" text NOT NULL,
	"title" text NOT NULL,
	"status" "tattvaloka_content_status" DEFAULT 'draft' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattvaloka_content_modules_content_key_unique" UNIQUE("content_key")
);
--> statement-breakpoint
CREATE TABLE "tattvaloka_content_paths" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"content_key" text NOT NULL,
	"title" text NOT NULL,
	"status" "tattvaloka_content_status" DEFAULT 'draft' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattvaloka_content_paths_content_key_unique" UNIQUE("content_key")
);
--> statement-breakpoint
CREATE TABLE "tattvaloka_content_unit_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"unit_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"is_current" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattvaloka_content_unit_versions_unit_id_version_number_unique" UNIQUE("unit_id","version_number")
);
--> statement-breakpoint
CREATE TABLE "tattvaloka_content_units" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"module_id" uuid NOT NULL,
	"content_key" text NOT NULL,
	"status" "tattvaloka_content_status" DEFAULT 'draft' NOT NULL,
	"position" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattvaloka_content_units_content_key_unique" UNIQUE("content_key")
);
--> statement-breakpoint
ALTER TABLE "tattvaloka_content_modules" ADD CONSTRAINT "tattvaloka_content_modules_path_id_tattvaloka_content_paths_id_fk" FOREIGN KEY ("path_id") REFERENCES "public"."tattvaloka_content_paths"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tattvaloka_content_unit_versions" ADD CONSTRAINT "tattvaloka_content_unit_versions_unit_id_tattvaloka_content_units_id_fk" FOREIGN KEY ("unit_id") REFERENCES "public"."tattvaloka_content_units"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tattvaloka_content_units" ADD CONSTRAINT "tattvaloka_content_units_module_id_tattvaloka_content_modules_id_fk" FOREIGN KEY ("module_id") REFERENCES "public"."tattvaloka_content_modules"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "tattvaloka_content_unit_versions_one_current_per_unit" ON "tattvaloka_content_unit_versions" USING btree ("unit_id") WHERE "tattvaloka_content_unit_versions"."is_current" = true;