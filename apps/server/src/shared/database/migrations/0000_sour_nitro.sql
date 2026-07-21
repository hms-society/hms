CREATE TABLE "integracao_eventos" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provedor" text NOT NULL,
	"tipo_evento" text NOT NULL,
	"id_externo" text,
	"payload" jsonb NOT NULL,
	"status" text DEFAULT 'RECEBIDO' NOT NULL,
	"criado_em" timestamp with time zone DEFAULT now() NOT NULL,
	"atualizado_em" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "idx_integracao_eventos_id_externo" ON "integracao_eventos" USING btree ("id_externo");--> statement-breakpoint
CREATE INDEX "idx_integracao_eventos_provedor_status" ON "integracao_eventos" USING btree ("provedor","status");