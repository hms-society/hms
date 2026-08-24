ALTER TABLE "intakes" ALTER COLUMN "legal_area_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "intakes" ALTER COLUMN "legal_topic_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "viability" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "decision" text;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "dynamic_form_id" uuid;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "dynamic_form_answers" jsonb DEFAULT '[]'::jsonb NOT NULL;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "dynamic_form_snapshot" jsonb;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "attendance_finalized_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "consultations" ADD COLUMN "attendance_finalized_by_collaborator_id" uuid;--> statement-breakpoint
ALTER TABLE "document_packages" ADD COLUMN "confirmed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "document_packages" ADD COLUMN "confirmed_by_collaborator_id" uuid;
