CREATE TABLE "formalizations" (
	"id" uuid PRIMARY KEY NOT NULL,
	"intake_id" uuid NOT NULL,
	"client_id" uuid NOT NULL,
	"consultation_id" uuid NOT NULL,
	"assigned_lawyer_id" uuid NOT NULL,
	"status" text DEFAULT 'in_progress' NOT NULL,
	"contract_form_id" uuid NOT NULL,
	"contract_form_snapshot" jsonb NOT NULL,
	"contract_form_answers" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"contract_form_state" text DEFAULT 'open' NOT NULL,
	"contract_form_revision" integer DEFAULT 0 NOT NULL,
	"contract_form_closed_at" timestamp with time zone,
	"contract_form_closed_by_collaborator_id" uuid,
	"documents_confirmed_at" timestamp with time zone,
	"documents_confirmed_by_collaborator_id" uuid,
	"documents_confirmed_revision" integer,
	"cancelled_at" timestamp with time zone,
	"cancelled_by_collaborator_id" uuid,
	"version" integer DEFAULT 1 NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "formalizations_status_check" CHECK ("formalizations"."status" in ('in_progress', 'completed', 'cancelled')),
	CONSTRAINT "formalizations_form_state_check" CHECK ("formalizations"."contract_form_state" in ('open', 'closed')),
	CONSTRAINT "formalizations_revision_check" CHECK ("formalizations"."contract_form_revision" >= 0 and "formalizations"."version" >= 1),
	CONSTRAINT "formalizations_confirmation_check" CHECK ((
        ("formalizations"."documents_confirmed_at" is null and "formalizations"."documents_confirmed_by_collaborator_id" is null and "formalizations"."documents_confirmed_revision" is null)
        or
        ("formalizations"."documents_confirmed_at" is not null and "formalizations"."documents_confirmed_by_collaborator_id" is not null and "formalizations"."documents_confirmed_revision" is not null)
      )),
	CONSTRAINT "formalizations_cancellation_check" CHECK ((
        ("formalizations"."status" = 'cancelled' and "formalizations"."cancelled_at" is not null and "formalizations"."cancelled_by_collaborator_id" is not null)
        or
        ("formalizations"."status" <> 'cancelled' and "formalizations"."cancelled_at" is null and "formalizations"."cancelled_by_collaborator_id" is null)
      ))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "formalizations_intake_uq" ON "formalizations" USING btree ("intake_id");--> statement-breakpoint
CREATE INDEX "formalizations_assigned_lawyer_idx" ON "formalizations" USING btree ("assigned_lawyer_id","status");
