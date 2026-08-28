CREATE TYPE "public"."classificacao_acesso" AS ENUM('INTERNO', 'CLIENTE', 'RESTRITO', 'CONFIDENCIAL', 'PARCEIRO_LIBERADO');--> statement-breakpoint
CREATE TABLE "auditoria_documentos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"usuario_responsavel_id" uuid NOT NULL,
	"valor_anterior" "classificacao_acesso" NOT NULL,
	"valor_novo" "classificacao_acesso" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "logs_acesso_externo" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"documento_id" uuid NOT NULL,
	"ip_origem" varchar(45) NOT NULL,
	"token_utilizado" text,
	"motivo_negativa" text NOT NULL,
	"data_hora" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "classificacao_acesso" "classificacao_acesso" DEFAULT 'INTERNO' NOT NULL;--> statement-breakpoint
ALTER TABLE "auditoria_documentos" ADD CONSTRAINT "auditoria_documentos_documento_id_documents_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "logs_acesso_externo" ADD CONSTRAINT "logs_acesso_externo_documento_id_documents_id_fk" FOREIGN KEY ("documento_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;