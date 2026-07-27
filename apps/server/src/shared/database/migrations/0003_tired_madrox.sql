CREATE TABLE "seguranca_usuario" (
	"usuario_id" uuid PRIMARY KEY NOT NULL,
	"tentativas_falhas" integer DEFAULT 0 NOT NULL,
	"bloqueado_ate" timestamp with time zone,
	"sessao_ativa_id" uuid
);
