ALTER TABLE "case_tasks" ADD COLUMN "title" text DEFAULT 'Sem título' NOT NULL;--> statement-breakpoint
ALTER TABLE "case_tasks" ALTER COLUMN "title" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "case_tasks" ADD COLUMN "blocks_case_closure" boolean DEFAULT false NOT NULL;
