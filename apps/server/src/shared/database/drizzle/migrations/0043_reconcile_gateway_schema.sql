CREATE TYPE "public"."classificacao_acesso" AS ENUM('INTERNO', 'CLIENTE', 'RESTRITO', 'CONFIDENCIAL', 'PARCEIRO_LIBERADO');--> statement-breakpoint
CREATE TABLE "auditoria_documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"usuario_responsavel_id" uuid NOT NULL,
	"valor_anterior" "classificacao_acesso" NOT NULL,
	"valor_novo" "classificacao_acesso" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
CREATE TABLE "logs_acesso_externo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"ip_origem" varchar(45) NOT NULL,
	"token_utilizado" text,
	"motivo_negativa" text NOT NULL,
	"data_hora" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classificacao_acesso" "classificacao_acesso" DEFAULT 'INTERNO' NOT NULL;--> statement-breakpoint
ALTER TABLE "auditoria_documentos" ADD CONSTRAINT "auditoria_documentos_documento_id_documents_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_acesso_externo" ADD CONSTRAINT "logs_acesso_externo_documento_id_documents_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TYPE "public"."legal_case_status" ADD VALUE 'ready_for_legal_production' BEFORE 'legal_production';--> statement-breakpoint
CREATE TYPE "public"."case_checklist_gate_decision" AS ENUM('approved', 'approved_with_exception', 'blocked_insufficient', 'rejected_on_merit');--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_decision" "case_checklist_gate_decision";--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_decided_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_decided_by" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_gate_remarks" text;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "dossier_gate_homologated_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "dossier_gate_homologated_by" uuid;--> statement-breakpoint
ALTER TABLE "cases" ADD CONSTRAINT "cases_checklist_reason_remarks_check" CHECK ("cases"."checklist_gate_decision" NOT IN ('approved_with_exception', 'blocked_insufficient', 'rejected_on_merit') OR ("cases"."checklist_gate_remarks" IS NOT NULL AND char_length(btrim("cases"."checklist_gate_remarks")) > 0));--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_completed_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "cases" ADD COLUMN "checklist_completed_by" uuid;--> statement-breakpoint
CREATE TYPE "public"."case_checklist_item_status" AS ENUM('pending', 'validated');--> statement-breakpoint
CREATE TABLE "case_checklist_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"case_id" uuid NOT NULL,
	"template_item_key" text NOT NULL,
	"title" text NOT NULL,
	"is_required" boolean DEFAULT true NOT NULL,
	"status" "case_checklist_item_status" DEFAULT 'pending' NOT NULL,
	"document_file_id" uuid,
	"document_file_name" text,
	"validated_at" timestamp with time zone,
	"validated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "case_checklist_items_template_key_not_blank_check" CHECK (char_length(btrim("case_checklist_items"."template_item_key")) > 0),
	CONSTRAINT "case_checklist_items_title_not_blank_check" CHECK (char_length(btrim("case_checklist_items"."title")) > 0),
	CONSTRAINT "case_checklist_items_validated_document_check" CHECK ("case_checklist_items"."status" <> 'validated' OR ("case_checklist_items"."document_file_id" IS NOT NULL AND "case_checklist_items"."validated_at" IS NOT NULL AND "case_checklist_items"."validated_by" IS NOT NULL))
);--> statement-breakpoint
ALTER TABLE "case_checklist_items" ADD CONSTRAINT "case_checklist_items_case_id_cases_id_fk" FOREIGN KEY ("case_id") REFERENCES "public"."cases"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "case_checklist_items_case_template_key_uidx" ON "case_checklist_items" USING btree ("case_id","template_item_key");--> statement-breakpoint
CREATE INDEX "case_checklist_items_case_status_idx" ON "case_checklist_items" USING btree ("case_id","status");
