CREATE TYPE "public"."third_party_document_type" AS ENUM('cnpj', 'official_registration', 'other_national_document');--> statement-breakpoint
CREATE TYPE "public"."third_party_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."third_party_type" AS ENUM('union', 'association', 'partner_company', 'institutional_partner', 'other');--> statement-breakpoint
CREATE TABLE "third_parties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "third_party_type" NOT NULL,
	"legal_name" text NOT NULL,
	"trade_name" text,
	"document_type" "third_party_document_type" NOT NULL,
	"tax_id_value" text NOT NULL,
	"tax_id_description" text,
	"internal_responsible_id" uuid NOT NULL,
	"relationship_types" jsonb NOT NULL,
	"status" "third_party_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "third_parties_relationship_types_check" CHECK (jsonb_typeof("third_parties"."relationship_types") = 'array' AND jsonb_array_length("third_parties"."relationship_types") > 0)
);
--> statement-breakpoint
ALTER TABLE "third_parties" ADD CONSTRAINT "third_parties_internal_responsible_id_collaborators_id_fk" FOREIGN KEY ("internal_responsible_id") REFERENCES "public"."collaborators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "third_parties_tax_id_uidx" ON "third_parties" USING btree ("document_type","tax_id_value");--> statement-breakpoint
CREATE INDEX "third_parties_status_idx" ON "third_parties" USING btree ("status");--> statement-breakpoint
CREATE INDEX "third_parties_responsible_idx" ON "third_parties" USING btree ("internal_responsible_id");