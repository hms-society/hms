CREATE TABLE "legal_areas" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "legal_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"legal_area_id" uuid NOT NULL,
	"name" text NOT NULL,
	"active" boolean DEFAULT true NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "legal_topics" ADD CONSTRAINT "legal_topics_legal_area_id_legal_areas_id_fk" FOREIGN KEY ("legal_area_id") REFERENCES "public"."legal_areas"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "legal_areas_name_uidx" ON "legal_areas" USING btree (lower(btrim("name")));--> statement-breakpoint
CREATE UNIQUE INDEX "legal_topics_area_name_uidx" ON "legal_topics" USING btree ("legal_area_id",lower(btrim("name")));