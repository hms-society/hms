ALTER TABLE "dynamic_form_duplicate_operations" RENAME TO "dynamic_form_operations";--> statement-breakpoint
ALTER TABLE "dynamic_form_administration_audit_entries" DROP CONSTRAINT "dynamic_form_admin_audit_action_check";--> statement-breakpoint
ALTER TABLE "dynamic_form_administration_audit_entries" DROP CONSTRAINT "dynamic_form_admin_audit_actor_collaborator_id_collaborators_id_fk";--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" DROP CONSTRAINT "dynamic_form_duplicate_actor_collaborator_id_collaborators_id_fk";--> statement-breakpoint

ALTER TABLE "dynamic_forms" ADD COLUMN "version" integer;--> statement-breakpoint
UPDATE "dynamic_forms" SET "version" = 1 WHERE "version" IS NULL;--> statement-breakpoint
ALTER TABLE "dynamic_forms" ALTER COLUMN "version" SET DEFAULT 1;--> statement-breakpoint
ALTER TABLE "dynamic_forms" ALTER COLUMN "version" SET NOT NULL;--> statement-breakpoint

UPDATE "dynamic_forms"
SET "fields" = (
  SELECT jsonb_agg(
    CASE
      WHEN jsonb_typeof(field->'options') = 'array' THEN
        field || jsonb_build_object(
          'options', (
            SELECT jsonb_agg(
              CASE
                WHEN option ? 'id' THEN option
                ELSE option || jsonb_build_object('id', gen_random_uuid())
              END
              ORDER BY option_ordinality
            )
            FROM jsonb_array_elements(field->'options') WITH ORDINALITY AS options(option, option_ordinality)
          )
        )
      ELSE field
    END
    ORDER BY field_ordinality
  )
  FROM jsonb_array_elements("dynamic_forms"."fields") WITH ORDINALITY AS fields(field, field_ordinality)
);--> statement-breakpoint

ALTER TABLE "dynamic_form_operations" ADD COLUMN "action" text;--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ADD COLUMN "target_dynamic_form_id" uuid;--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ADD COLUMN "expected_version" integer;--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ADD COLUMN "canonical_request" jsonb;--> statement-breakpoint
UPDATE "dynamic_form_operations"
SET
  "action" = 'duplicated',
  "target_dynamic_form_id" = ("result"->>'id')::uuid,
  "expected_version" = NULL,
  "canonical_request" = jsonb_build_object(
    'kind', 'duplicated',
    'sourceDynamicFormId', "source_dynamic_form_id"::text,
    'normalizedName', "requested_normalized_name"
  ),
  "result" = jsonb_set("result", '{version}', '1'::jsonb, true);--> statement-breakpoint
UPDATE "dynamic_form_operations"
SET "result" = jsonb_set(
  "result",
  '{fields}',
  (
    SELECT jsonb_agg(
      CASE
        WHEN jsonb_typeof(field->'options') = 'array' THEN
          field || jsonb_build_object(
            'options', (
              SELECT jsonb_agg(
                CASE
                  WHEN option ? 'id' THEN option
                  ELSE option || jsonb_build_object('id', gen_random_uuid())
                END
                ORDER BY option_ordinality
              )
              FROM jsonb_array_elements(field->'options') WITH ORDINALITY AS options(option, option_ordinality)
            )
          )
        ELSE field
      END
      ORDER BY field_ordinality
    )
    FROM jsonb_array_elements("dynamic_form_operations"."result"->'fields') WITH ORDINALITY AS fields(field, field_ordinality)
  ),
  true
)
WHERE NOT EXISTS (
  SELECT 1
  FROM "dynamic_forms"
  WHERE "dynamic_forms"."id" = "dynamic_form_operations"."target_dynamic_form_id"
);--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ALTER COLUMN "action" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ALTER COLUMN "target_dynamic_form_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ALTER COLUMN "canonical_request" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" DROP COLUMN "source_dynamic_form_id";--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" DROP COLUMN "requested_normalized_name";--> statement-breakpoint

ALTER TABLE "dynamic_forms" ADD CONSTRAINT "dynamic_forms_version_check" CHECK ("dynamic_forms"."version" >= 1);--> statement-breakpoint
ALTER TABLE "dynamic_form_administration_audit_entries" ADD CONSTRAINT "dynamic_form_admin_audit_actor_collaborator_id_collaborators_id_fk" FOREIGN KEY ("actor_collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ADD CONSTRAINT "dynamic_form_duplicate_actor_collaborator_id_collaborators_id_fk" FOREIGN KEY ("actor_collaborator_id") REFERENCES "public"."collaborators"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "dynamic_form_administration_audit_entries" ADD CONSTRAINT "dynamic_form_admin_audit_action_check" CHECK ("dynamic_form_administration_audit_entries"."action" in ('duplicated', 'availability_changed', 'deleted', 'created', 'updated'));--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ADD CONSTRAINT "dynamic_form_operations_action_check" CHECK ("dynamic_form_operations"."action" in ('duplicated', 'created', 'updated'));--> statement-breakpoint
ALTER TABLE "dynamic_form_operations" ADD CONSTRAINT "dynamic_form_operations_expected_version_check" CHECK ((
  ("dynamic_form_operations"."action" = 'updated' and "dynamic_form_operations"."expected_version" is not null and "dynamic_form_operations"."expected_version" >= 1)
  or
  ("dynamic_form_operations"."action" <> 'updated' and "dynamic_form_operations"."expected_version" is null)
));
