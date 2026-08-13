CREATE TABLE "consultation_identified_risks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"appointment_id" uuid NOT NULL,
	"intake_id" uuid,
	"client_id" uuid NOT NULL,
	"assigned_lawyer_id" uuid NOT NULL,
	"legal_area_id" uuid NOT NULL,
	"legal_topic_id" uuid NOT NULL,
	"status" text NOT NULL,
	"modality" text NOT NULL,
	"channel" text,
	"template_id" uuid,
	"template_answers" jsonb,
	"primary_legal_question" text,
	"guidance_provided" text,
	"notes" text,
	"started_at" timestamp with time zone,
	"completed_at" timestamp with time zone,
	"no_show_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "consultations_appointment_id_unique" UNIQUE("appointment_id")
);
--> statement-breakpoint
CREATE TABLE "consultation_potential_legal_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"description" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "consultation_relevant_facts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"description" text NOT NULL,
	"occurred_on" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "consultation_suggestions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"consultation_id" uuid NOT NULL,
	"target" text NOT NULL,
	"content" text NOT NULL,
	"status" text NOT NULL,
	"suggested_at" timestamp with time zone DEFAULT now() NOT NULL,
	"reviewed_at" timestamp with time zone,
	"reviewed_by_collaborator_id" uuid
);
--> statement-breakpoint
ALTER TABLE "consultation_identified_risks" ADD CONSTRAINT "consultation_identified_risks_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_intake_id_intakes_id_fk" FOREIGN KEY ("intake_id") REFERENCES "public"."intakes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_assigned_lawyer_id_collaborators_id_fk" FOREIGN KEY ("assigned_lawyer_id") REFERENCES "public"."collaborators"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_legal_area_id_legal_areas_id_fk" FOREIGN KEY ("legal_area_id") REFERENCES "public"."legal_areas"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultations" ADD CONSTRAINT "consultations_legal_topic_id_legal_topics_id_fk" FOREIGN KEY ("legal_topic_id") REFERENCES "public"."legal_topics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_potential_legal_requests" ADD CONSTRAINT "consultation_potential_legal_requests_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_relevant_facts" ADD CONSTRAINT "consultation_relevant_facts_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_suggestions" ADD CONSTRAINT "consultation_suggestions_consultation_id_consultations_id_fk" FOREIGN KEY ("consultation_id") REFERENCES "public"."consultations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consultation_suggestions" ADD CONSTRAINT "consultation_suggestions_reviewed_by_collaborator_id_collaborators_id_fk" FOREIGN KEY ("reviewed_by_collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE no action ON UPDATE no action;