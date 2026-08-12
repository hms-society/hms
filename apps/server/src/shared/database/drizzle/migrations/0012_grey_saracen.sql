ALTER TABLE "consultations" DROP CONSTRAINT "consultations_appointment_id_unique";--> statement-breakpoint
ALTER TABLE "consultations" ALTER COLUMN "appointment_id" DROP NOT NULL;