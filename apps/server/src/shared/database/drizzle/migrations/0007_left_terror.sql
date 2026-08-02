CREATE TYPE "public"."collaborator_profile" AS ENUM('admin', 'attendant', 'lawyer', 'paralegal', 'supervisor');--> statement-breakpoint
CREATE TYPE "public"."registration_attempt_status" AS ENUM('pending_auth', 'auth_invited', 'completed', 'reconciliation_required');--> statement-breakpoint
CREATE TABLE "collaborator_legal_expertises" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"collaborator_id" uuid NOT NULL,
	"legal_area_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborator_legal_expertise_topics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"expertise_id" uuid NOT NULL,
	"legal_topic_id" uuid NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborators" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"professional_name" text NOT NULL,
	"job_title" text,
	"profile" "collaborator_profile" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "collaborator_registration_attempts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"normalized_email" varchar(254) NOT NULL,
	"payload_hash" varchar(128) NOT NULL,
	"auth_user_id" uuid,
	"status" "registration_attempt_status" NOT NULL,
	"last_error" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_email_unique";--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "last_access_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "collaborator_legal_expertises" ADD CONSTRAINT "collaborator_legal_expertises_collaborator_id_collaborators_id_fk" FOREIGN KEY ("collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborator_legal_expertise_topics" ADD CONSTRAINT "collaborator_legal_expertise_topics_expertise_id_collaborator_legal_expertises_id_fk" FOREIGN KEY ("expertise_id") REFERENCES "public"."collaborator_legal_expertises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "collaborators" ADD CONSTRAINT "collaborators_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "collaborator_legal_expertises_area_uidx" ON "collaborator_legal_expertises" USING btree ("collaborator_id","legal_area_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collaborator_legal_expertise_topics_uidx" ON "collaborator_legal_expertise_topics" USING btree ("expertise_id","legal_topic_id");--> statement-breakpoint
CREATE UNIQUE INDEX "collaborators_user_id_uidx" ON "collaborators" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "collaborators_profile_idx" ON "collaborators" USING btree ("profile");--> statement-breakpoint
CREATE UNIQUE INDEX "collaborator_registration_attempts_email_uidx" ON "collaborator_registration_attempts" USING btree ("normalized_email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_normalized_uidx" ON "users" USING btree (lower(btrim("email")));