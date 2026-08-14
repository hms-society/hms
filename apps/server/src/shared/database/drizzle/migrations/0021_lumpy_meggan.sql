CREATE TABLE "appointments" (
	"id" uuid PRIMARY KEY NOT NULL,
	"intake_id" uuid NOT NULL,
	"schedule_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"starts_at" timestamp with time zone NOT NULL,
	"ends_at" timestamp with time zone NOT NULL,
	"status" text NOT NULL,
	"cancelled_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "appointments_status_check" CHECK ("appointments"."status" in ('scheduled', 'cancelled')),
	CONSTRAINT "appointments_period_check" CHECK ("appointments"."ends_at" > "appointments"."starts_at")
);
--> statement-breakpoint
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_modality_check";--> statement-breakpoint
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_modality_channel_check";--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "appointment_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "modality" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "appointments_intake_id_uq" ON "appointments" USING btree ("intake_id");--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_modality_check" CHECK ("consultations"."modality" in ('in_person', 'virtual'));--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_modality_channel_check" CHECK (("consultations"."modality" = 'in_person' and "consultations"."channel" is null) or ("consultations"."modality" = 'virtual' and "consultations"."channel" is not null));