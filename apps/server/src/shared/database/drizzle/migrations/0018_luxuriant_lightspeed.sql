CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"current_version_id" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "document_packages" (
	"id" uuid PRIMARY KEY NOT NULL,
	"context_type" text NOT NULL,
	"context_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "document_packages_context_type_check" CHECK ("document_packages"."context_type" in ('consultation', 'formalization', 'case'))
);
--> statement-breakpoint
CREATE TABLE "package_documents" (
	"id" uuid PRIMARY KEY NOT NULL,
	"document_package_id" uuid NOT NULL,
	"document_id" uuid NOT NULL,
	"document_specification_id" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_document_package_id_document_packages_id_fk" FOREIGN KEY ("document_package_id") REFERENCES "public"."document_packages"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "package_documents" ADD CONSTRAINT "package_documents_document_specification_id_document_specifications_id_fk" FOREIGN KEY ("document_specification_id") REFERENCES "public"."document_specifications"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "documents_current_version_id_idx" ON "documents" USING btree ("current_version_id");--> statement-breakpoint
CREATE UNIQUE INDEX "document_packages_context_uq" ON "document_packages" USING btree ("context_type","context_id");--> statement-breakpoint
CREATE UNIQUE INDEX "package_documents_package_document_uq" ON "package_documents" USING btree ("document_package_id","document_id");--> statement-breakpoint
CREATE UNIQUE INDEX "package_documents_package_specification_uq" ON "package_documents" USING btree ("document_package_id","document_specification_id");--> statement-breakpoint
CREATE INDEX "package_documents_document_id_idx" ON "package_documents" USING btree ("document_id");