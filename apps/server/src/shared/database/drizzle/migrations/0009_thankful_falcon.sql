CREATE TABLE "private_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"client_id" uuid NOT NULL,
	"collaborator_id" uuid NOT NULL,
	"intake_id" uuid NOT NULL,
	"client_phone" text,
	"direction" "communication_direction" NOT NULL,
	"content" text,
	"file_ids" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "private_messages" ADD CONSTRAINT "private_messages_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE cascade ON UPDATE no action;