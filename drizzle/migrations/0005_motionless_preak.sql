CREATE TYPE "public"."id_family" AS ENUM('TMP', 'TRK', 'INS');--> statement-breakpoint
CREATE TABLE "public_identifiers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"public_id" text NOT NULL,
	"id_family" "id_family" NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"archived_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "public_identifiers_public_id_unique" UNIQUE("public_id")
);
--> statement-breakpoint
ALTER TABLE "public_identifiers" ADD CONSTRAINT "public_identifiers_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "public_identifiers_identity_id_idx" ON "public_identifiers" USING btree ("identity_id");--> statement-breakpoint
CREATE INDEX "public_identifiers_is_active_idx" ON "public_identifiers" USING btree ("is_active");