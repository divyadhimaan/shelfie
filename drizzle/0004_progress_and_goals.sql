CREATE TABLE "goals" (
	"user_id" text NOT NULL,
	"year" integer NOT NULL,
	"target" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "goals_user_id_year_pk" PRIMARY KEY("user_id","year"),
	CONSTRAINT "goals_target_range" CHECK ("goals"."target" between 1 and 1000)
);
--> statement-breakpoint
CREATE TABLE "progress_updates" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"read_id" uuid NOT NULL,
	"page" integer,
	"percent" integer,
	"note" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "progress_updates_has_value" CHECK ("progress_updates"."page" is not null or "progress_updates"."percent" is not null),
	CONSTRAINT "progress_updates_percent_range" CHECK ("progress_updates"."percent" is null or "progress_updates"."percent" between 0 and 100)
);
--> statement-breakpoint
ALTER TABLE "goals" ADD CONSTRAINT "goals_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_updates" ADD CONSTRAINT "progress_updates_read_id_reads_id_fk" FOREIGN KEY ("read_id") REFERENCES "public"."reads"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "progress_updates_read_idx" ON "progress_updates" USING btree ("read_id","created_at");