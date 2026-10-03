CREATE TYPE "public"."waba_account_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_channel_quality" AS ENUM('GREEN', 'YELLOW', 'RED', 'UNKNOWN');--> statement-breakpoint
CREATE TYPE "public"."whatsapp_channel_status" AS ENUM('active', 'disabled');--> statement-breakpoint
CREATE TABLE "waba_accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waba_id" text NOT NULL,
	"name" text NOT NULL,
	"access_token" text NOT NULL,
	"status" "waba_account_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "whatsapp_channels" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"waba_account_id" uuid NOT NULL,
	"phone_number_id" text NOT NULL,
	"display_phone_number" text NOT NULL,
	"verified_name" text NOT NULL,
	"quality_rating" "whatsapp_channel_quality" DEFAULT 'UNKNOWN' NOT NULL,
	"assigned_lawyer_id" uuid NOT NULL,
	"status" "whatsapp_channel_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "whatsapp_channels" ADD CONSTRAINT "whatsapp_channels_waba_account_id_waba_accounts_id_fk" FOREIGN KEY ("waba_account_id") REFERENCES "public"."waba_accounts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "whatsapp_channels" ADD CONSTRAINT "whatsapp_channels_assigned_lawyer_id_users_id_fk" FOREIGN KEY ("assigned_lawyer_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;