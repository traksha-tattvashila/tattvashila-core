CREATE TABLE "institutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"ins_id" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "institutions_ins_id_unique" UNIQUE("ins_id")
);
--> statement-breakpoint
CREATE INDEX "institutions_ins_id_idx" ON "institutions" USING btree ("ins_id");