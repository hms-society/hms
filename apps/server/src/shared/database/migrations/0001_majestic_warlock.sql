CREATE TYPE "public"."client_type" AS ENUM('natural', 'legal');--> statement-breakpoint
CREATE TYPE "public"."consent_type" AS ENUM('data_processing', 'whatsapp_communication', 'email_communication', 'third_party_sharing');--> statement-breakpoint
CREATE TYPE "public"."tax_id_type" AS ENUM('cpf', 'cnpj');--> statement-breakpoint
ALTER TYPE "public"."intake_status" ADD VALUE 'registered' BEFORE 'consultation_scheduled';--> statement-breakpoint
CREATE TABLE "client_consents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"type" "consent_type" NOT NULL,
	"granted_at" timestamp with time zone DEFAULT now() NOT NULL,
	"revoked_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "client_type" NOT NULL,
	"name" text,
	"legal_name" text,
	"trade_name" text,
	"tax_id_type" "tax_id_type" NOT NULL,
	"tax_id_value" text NOT NULL,
	"phone" text,
	"email" text,
	"street" text,
	"number" text,
	"complement" text,
	"district" text,
	"city" text,
	"state" text,
	"zip_code" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "clients_identity_fields_check" CHECK ((("type" = 'natural' AND "name" IS NOT NULL AND "legal_name" IS NULL AND "tax_id_type" = 'cpf') OR ("type" = 'legal' AND "name" IS NULL AND "legal_name" IS NOT NULL AND "tax_id_type" = 'cnpj'))),
	CONSTRAINT "clients_address_fields_check" CHECK ((("street" IS NULL AND "number" IS NULL AND "district" IS NULL AND "city" IS NULL AND "state" IS NULL AND "zip_code" IS NULL) OR ("street" IS NOT NULL AND "number" IS NOT NULL AND "district" IS NOT NULL AND "city" IS NOT NULL AND "state" IS NOT NULL AND "zip_code" IS NOT NULL)))
);
--> statement-breakpoint
ALTER TABLE "client_consents" ADD CONSTRAINT "client_consents_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "client_consents_client_id_idx" ON "client_consents" USING btree ("client_id");--> statement-breakpoint
CREATE UNIQUE INDEX "client_consents_active_uidx" ON "client_consents" USING btree ("client_id","type") WHERE "client_consents"."revoked_at" IS NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "clients_tax_id_uidx" ON "clients" USING btree ("tax_id_type","tax_id_value");--> statement-breakpoint
CREATE INDEX "clients_phone_idx" ON "clients" USING btree ("phone");