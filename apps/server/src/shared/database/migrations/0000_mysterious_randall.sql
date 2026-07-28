CREATE TABLE "integracao_evento" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provedor" varchar(50) NOT NULL,
	"payload" jsonb NOT NULL,
	"status" varchar(30) NOT NULL,
	"erro" text,
	"created_at" timestamp DEFAULT now() NOT NULL
);
