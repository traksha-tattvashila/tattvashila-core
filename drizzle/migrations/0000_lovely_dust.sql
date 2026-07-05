CREATE TYPE "public"."contact_type" AS ENUM('phone', 'email');--> statement-breakpoint
CREATE TYPE "public"."identity_state" AS ENUM('TMP', 'TRK');--> statement-breakpoint
CREATE TABLE "identities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_state" "identity_state" DEFAULT 'TMP' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "identity_operational_metadata" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"processing_state" text NOT NULL,
	"state_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_operational_metadata_identity_id_unique" UNIQUE("identity_id")
);
--> statement-breakpoint
CREATE TABLE "identity_verified_contacts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"contact_type" "contact_type" NOT NULL,
	"contact_value" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_verified_contacts_type_value_unique" UNIQUE("contact_type","contact_value")
);
--> statement-breakpoint
ALTER TABLE "identity_operational_metadata" ADD CONSTRAINT "identity_operational_metadata_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "identity_verified_contacts" ADD CONSTRAINT "identity_verified_contacts_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "identities_identity_state_idx" ON "identities" USING btree ("identity_state");--> statement-breakpoint
CREATE INDEX "identity_operational_metadata_identity_id_idx" ON "identity_operational_metadata" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "identity_verified_contacts_identity_id_idx" ON "identity_verified_contacts" USING btree ("identity_id");