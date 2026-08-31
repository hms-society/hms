CREATE TABLE "log_auditoria" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"id_usuario" uuid NOT NULL,
	"perfil_usuario" varchar(50) NOT NULL,
	"entidade" varchar(50) NOT NULL,
	"id_entidade" uuid NOT NULL,
	"campo_alterado" varchar(100) NOT NULL,
	"valor_anterior" text,
	"valor_novo" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
