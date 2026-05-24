CREATE TABLE "data_rows" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"field_one" text NOT NULL,
	"field_two" text NOT NULL,
	"field_three" text NOT NULL,
	"source_transfer_id" uuid,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"notification_email" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "otp_codes" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"email" text NOT NULL,
	"code_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "rate_limits" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"action" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "transfers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_organization_id" uuid NOT NULL,
	"to_organization_id" uuid NOT NULL,
	"created_by_user_id" uuid NOT NULL,
	"message" text NOT NULL,
	"row_count" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "data_rows" ADD CONSTRAINT "data_rows_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "data_rows" ADD CONSTRAINT "data_rows_source_transfer_id_transfers_id_fk" FOREIGN KEY ("source_transfer_id") REFERENCES "public"."transfers"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "otp_codes" ADD CONSTRAINT "otp_codes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_from_organization_id_organizations_id_fk" FOREIGN KEY ("from_organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_to_organization_id_organizations_id_fk" FOREIGN KEY ("to_organization_id") REFERENCES "public"."organizations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transfers" ADD CONSTRAINT "transfers_created_by_user_id_users_id_fk" FOREIGN KEY ("created_by_user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "data_rows_organization_id_idx" ON "data_rows" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "data_rows_source_transfer_id_idx" ON "data_rows" USING btree ("source_transfer_id");--> statement-breakpoint
CREATE INDEX "data_rows_deleted_at_idx" ON "data_rows" USING btree ("deleted_at");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE INDEX "otp_codes_email_idx" ON "otp_codes" USING btree ("email");--> statement-breakpoint
CREATE INDEX "otp_codes_user_id_idx" ON "otp_codes" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "otp_codes_expires_at_idx" ON "otp_codes" USING btree ("expires_at");--> statement-breakpoint
CREATE INDEX "rate_limits_key_action_idx" ON "rate_limits" USING btree ("key","action");--> statement-breakpoint
CREATE INDEX "rate_limits_created_at_idx" ON "rate_limits" USING btree ("created_at");--> statement-breakpoint
CREATE INDEX "transfers_from_organization_id_idx" ON "transfers" USING btree ("from_organization_id");--> statement-breakpoint
CREATE INDEX "transfers_to_organization_id_idx" ON "transfers" USING btree ("to_organization_id");--> statement-breakpoint
CREATE INDEX "transfers_created_by_user_id_idx" ON "transfers" USING btree ("created_by_user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_idx" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_organization_id_idx" ON "users" USING btree ("organization_id");