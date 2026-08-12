ALTER TABLE "consultations" DROP CONSTRAINT "consultations_modality_check";--> statement-breakpoint
ALTER TABLE "consultations" DROP CONSTRAINT "consultations_modality_channel_check";--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "appointment_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "modality" DROP NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "consultations_intake_id_uq" ON "consultations" USING btree ("intake_id");--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_modality_check" CHECK ("consultations"."modality" is null or "consultations"."modality" in ('in_person', 'virtual'));--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_modality_channel_check" CHECK (("consultations"."appointment_id" is null and "consultations"."modality" is null and "consultations"."channel" is null) or ("consultations"."appointment_id" is not null and "consultations"."modality" = 'in_person' and "consultations"."channel" is null) or ("consultations"."appointment_id" is not null and "consultations"."modality" = 'virtual' and "consultations"."channel" is not null));