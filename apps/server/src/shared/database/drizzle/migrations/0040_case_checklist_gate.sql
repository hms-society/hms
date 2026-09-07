ALTER TYPE "public"."legal_case_status" ADD VALUE 'ready_for_legal_production' BEFORE 'legal_production';--> statement-breakpoint
CREATE TYPE "public"."case_checklist_gate_decision" AS ENUM('approved', 'approved_with_exception', 'blocked_insufficient', 'rejected_on_merit');--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_decision" "case_checklist_gate_decision";--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_decided_by" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_remarks" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "dossier_gate_homologated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "dossier_gate_homologated_by" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_checklist_reason_remarks_check" CHECK ("cases"."checklist_gate_decision" NOT IN ('approved_with_exception', 'blocked_insufficient', 'rejected_on_merit') OR ("cases"."checklist_gate_remarks" IS NOT NULL AND char_length(btrim("cases"."checklist_gate_remarks")) > 0));
