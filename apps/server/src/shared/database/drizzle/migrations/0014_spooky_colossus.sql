ALTER TABLE "consultations" DROP CONSTRAINT "consultations_responsible_id_collaborators_id_fk";
--> statement-breakpoint
ALTER TABLE "consultations" DROP COLUMN "responsible_id";