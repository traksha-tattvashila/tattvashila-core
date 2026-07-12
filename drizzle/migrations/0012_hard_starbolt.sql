CREATE TABLE "tattvapeetha_entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"institution_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tattvapeetha_entities_institution_id_unique" UNIQUE("institution_id")
);
--> statement-breakpoint
ALTER TABLE "tattvapeetha_entities" ADD CONSTRAINT "tattvapeetha_entities_institution_id_institutions_id_fk" FOREIGN KEY ("institution_id") REFERENCES "public"."institutions"("id") ON DELETE restrict ON UPDATE no action;