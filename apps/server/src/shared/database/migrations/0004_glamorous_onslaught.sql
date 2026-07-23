CREATE TYPE "public"."usuario_tipo" AS ENUM('interno', 'externo_cliente', 'externo_terceiro', 'externo_advogado');--> statement-breakpoint
CREATE TABLE "usuario" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nome" varchar(200) NOT NULL,
	"email" varchar(254) NOT NULL,
	"senha_hash" varchar(255) NOT NULL,
	"perfil_tecnico_id" uuid NOT NULL,
	"cargo_funcao_id" uuid,
	"tipo" "usuario_tipo" NOT NULL,
	"ativo" boolean DEFAULT true NOT NULL,
	"permissao_temporaria" boolean DEFAULT false NOT NULL,
	"permissao_validade" timestamp with time zone,
	"permissao_justificativa" text,
	"permissao_aprovador_id" uuid,
	"escopo_json" jsonb,
	"bloqueado_em" timestamp with time zone,
	"ultimo_acesso_em" timestamp with time zone,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"criado_por" uuid NOT NULL,
	CONSTRAINT "usuario_email_unique" UNIQUE("email")
);
