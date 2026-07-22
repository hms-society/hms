CREATE TABLE "parametro_sistema" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"chave" varchar(150) NOT NULL,
	"valor_json" jsonb NOT NULL,
	"descricao" text,
	"categoria" varchar(80),
	"editavel_em_runtime" boolean DEFAULT false NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "parametro_sistema_chave_unique" UNIQUE("chave")
);
