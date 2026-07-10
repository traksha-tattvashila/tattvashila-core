CREATE TABLE "tattvaloka_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattvaloka_participants_identity_id_unique" UNIQUE("identity_id")
);
--> statement-breakpoint
ALTER TABLE "tattvaloka_participants" ADD CONSTRAINT "tattvaloka_participants_identity_id_identities_id_fk" FOREIGN KEY ("identity_id") REFERENCES "public"."identities"("id") ON DELETE restrict ON UPDATE no action;