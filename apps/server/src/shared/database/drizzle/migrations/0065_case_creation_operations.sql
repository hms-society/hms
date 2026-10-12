CREATE TABLE "case_creation_operations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "intake_id" uuid NOT NULL,
  "actor_id" uuid NOT NULL,
  "operation_id" uuid NOT NULL,
  "fingerprint" text NOT NULL,
  "result" jsonb NOT NULL,
  "created_at" timestamp with time zone NOT NULL
);--> statement-breakpoint
ALTER TABLE "case_creation_operations" ADD CONSTRAINT "case_creation_operations_intake_id_cases_intake_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."cases"("intake_id") ON DELETE CASCADE ON UPDATE NO ACTION;--> statement-breakpoint
CREATE UNIQUE INDEX "case_creation_operations_actor_key_uidx" ON "case_creation_operations" USING btree ("actor_id", "operation_id");
