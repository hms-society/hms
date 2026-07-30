ALTER TABLE "intakes" DROP CONSTRAINT "intakes_other_closure_notes_check";--> statement-breakpoint
ALTER TABLE "intakes" ALTER COLUMN "closure_reason" SET DATA TYPE text;--> statement-breakpoint
UPDATE "intakes"
SET "closure_reason" = CASE "closure_reason"
  WHEN 'fora_do_escopo' THEN 'out_of_scope'
  WHEN 'inviavel_juridicamente' THEN 'legally_unviable'
  WHEN 'cliente_desistiu' THEN 'client_withdrew'
  WHEN 'sem_contato' THEN 'unable_to_contact'
  WHEN 'nao_compareceu' THEN 'no_show'
  WHEN 'encaminhado' THEN 'referred'
  WHEN 'outro' THEN 'other'
  ELSE "closure_reason"
END
WHERE "closure_reason" IS NOT NULL;--> statement-breakpoint
DROP TYPE "public"."intake_closure_reason";--> statement-breakpoint
CREATE TYPE "public"."intake_closure_reason" AS ENUM('out_of_scope', 'legally_unviable', 'client_withdrew', 'unable_to_contact', 'no_show', 'referred', 'other');--> statement-breakpoint
ALTER TABLE "intakes" ALTER COLUMN "closure_reason" SET DATA TYPE "public"."intake_closure_reason" USING "closure_reason"::"public"."intake_closure_reason";--> statement-breakpoint
ALTER TABLE "intakes" ADD CONSTRAINT "intakes_other_closure_notes_check" CHECK ("intakes"."closure_reason" <> 'other'
        OR (
          "intakes"."closure_notes" IS NOT NULL
          AND char_length(btrim("intakes"."closure_notes")) > 0
        ));
