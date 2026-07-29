CREATE TYPE "public"."intake_closure_reason" AS ENUM('fora_do_escopo', 'inviavel_juridicamente', 'cliente_desistiu', 'sem_contato', 'nao_compareceu', 'encaminhado', 'outro');--> statement-breakpoint
CREATE TYPE "public"."intake_contact_channel" AS ENUM('whatsapp', 'email', 'phone', 'in_person');--> statement-breakpoint
CREATE TYPE "public"."intake_origin" AS ENUM('direct', 'referral', 'website', 'social_media', 'other');--> statement-breakpoint
CREATE TYPE "public"."intake_status" AS ENUM('consultation_scheduled', 'consultation_completed', 'viability_registered', 'in_formalization', 'contracted', 'closed_without_contract');--> statement-breakpoint
CREATE TYPE "public"."intake_urgency" AS ENUM('normal', 'high', 'urgent');--> statement-breakpoint
CREATE TABLE "intakes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"sequence_number" serial NOT NULL,
	"client_id" uuid NOT NULL,
	"responsible_id" uuid NOT NULL,
	"created_by" uuid NOT NULL,
	"updated_by" uuid NOT NULL,
	"origin" "intake_origin" NOT NULL,
	"contact_channel" "intake_contact_channel" NOT NULL,
	"legal_area_id" uuid NOT NULL,
	"legal_topic_id" uuid NOT NULL,
	"urgency" "intake_urgency" DEFAULT 'normal' NOT NULL,
	"demand_notes" text,
	"status" "intake_status" NOT NULL,
	"closure_reason" "intake_closure_reason",
	"closure_notes" text,
	"closed_at" timestamp with time zone,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "intakes_version_positive_check" CHECK ("intakes"."version" > 0),
	CONSTRAINT "intakes_updated_after_created_check" CHECK ("intakes"."updated_at" >= "intakes"."created_at"),
	CONSTRAINT "intakes_closure_fields_check" CHECK ((
        (
          "intakes"."status" = 'closed_without_contract'
          AND "intakes"."closure_reason" IS NOT NULL
          AND "intakes"."closed_at" IS NOT NULL
        )
        OR
        (
          "intakes"."status" <> 'closed_without_contract'
          AND "intakes"."closure_reason" IS NULL
          AND "intakes"."closure_notes" IS NULL
          AND "intakes"."closed_at" IS NULL
        )
      )),
	CONSTRAINT "intakes_other_closure_notes_check" CHECK ("intakes"."closure_reason" <> 'outro'
        OR (
          "intakes"."closure_notes" IS NOT NULL
          AND char_length(btrim("intakes"."closure_notes")) > 0
        ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "intakes_sequence_number_uidx" ON "intakes" USING btree ("sequence_number");--> statement-breakpoint
CREATE INDEX "intakes_client_created_at_idx" ON "intakes" USING btree ("client_id","created_at");--> statement-breakpoint
CREATE INDEX "intakes_status_updated_at_idx" ON "intakes" USING btree ("status","updated_at");--> statement-breakpoint
CREATE INDEX "intakes_responsible_status_idx" ON "intakes" USING btree ("responsible_id","status");