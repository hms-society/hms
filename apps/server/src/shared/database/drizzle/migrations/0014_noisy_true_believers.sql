DO $$
DECLARE
  invalid_record record;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM "document_specifications"
    WHERE jsonb_typeof("variables") <> 'array'
  ) THEN
    SELECT "id" INTO invalid_record
    FROM "document_specifications"
    WHERE jsonb_typeof("variables") <> 'array'
    LIMIT 1;

    RAISE EXCEPTION
      'Cannot migrate document specification variables: row % is not a JSON array',
      invalid_record.id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "document_specifications" specification
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(specification."variables") variable
      WHERE jsonb_typeof(variable) <> 'object'
        OR NOT (variable ? 'label')
        OR jsonb_typeof(variable->'label') <> 'string'
        OR NOT (variable ? 'technicalName')
        OR jsonb_typeof(variable->'technicalName') <> 'string'
        OR (
          variable ? 'description'
          AND jsonb_typeof(variable->'description') <> 'string'
        )
        OR EXISTS (
          SELECT 1
          FROM jsonb_object_keys(variable) AS object_key(key_name)
          WHERE key_name NOT IN ('label', 'technicalName', 'description')
        )
        OR (variable->>'technicalName') !~ '^[a-z][a-z0-9_]*$'
        OR (variable->>'technicalName') IN (
          'cliente_nome',
          'cliente_cpf',
          'area_juridica',
          'tema_juridico',
          'valor_honorarios'
        )
    )
  ) THEN
    SELECT specification."id" INTO invalid_record
    FROM "document_specifications" specification
    WHERE EXISTS (
      SELECT 1
      FROM jsonb_array_elements(specification."variables") variable
      WHERE jsonb_typeof(variable) <> 'object'
        OR NOT (variable ? 'label')
        OR jsonb_typeof(variable->'label') <> 'string'
        OR NOT (variable ? 'technicalName')
        OR jsonb_typeof(variable->'technicalName') <> 'string'
        OR (
          variable ? 'description'
          AND jsonb_typeof(variable->'description') <> 'string'
        )
        OR EXISTS (
          SELECT 1
          FROM jsonb_object_keys(variable) AS object_key(key_name)
          WHERE key_name NOT IN ('label', 'technicalName', 'description')
        )
        OR (variable->>'technicalName') !~ '^[a-z][a-z0-9_]*$'
        OR (variable->>'technicalName') IN (
          'cliente_nome',
          'cliente_cpf',
          'area_juridica',
          'tema_juridico',
          'valor_honorarios'
        )
    )
    LIMIT 1;

    RAISE EXCEPTION
      'Cannot migrate document specification variables: row % contains an incompatible variable object',
      invalid_record.id;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM "document_specifications" specification
    WHERE EXISTS (
      SELECT 1
      FROM (
        SELECT variable->>'technicalName' AS technical_name
        FROM jsonb_array_elements(specification."variables") variable
        GROUP BY variable->>'technicalName'
        HAVING count(*) > 1
      ) duplicate_variables
    )
  ) THEN
    SELECT specification."id" INTO invalid_record
    FROM "document_specifications" specification
    WHERE EXISTS (
      SELECT 1
      FROM (
        SELECT variable->>'technicalName' AS technical_name
        FROM jsonb_array_elements(specification."variables") variable
        GROUP BY variable->>'technicalName'
        HAVING count(*) > 1
      ) duplicate_variables
    )
    LIMIT 1;

    RAISE EXCEPTION
      'Cannot migrate document specification variables: row % contains duplicate technical names',
      invalid_record.id;
  END IF;
END $$;--> statement-breakpoint
UPDATE "document_specifications"
SET "status" = 'unavailable'
WHERE btrim("content") = '';--> statement-breakpoint
ALTER TABLE "document_specifications" ALTER COLUMN "content" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "document_specifications"
  ALTER COLUMN "content" SET DATA TYPE jsonb
  USING CASE
    WHEN btrim("content") = '' THEN
      '{"type":"doc","content":[{"type":"paragraph"}]}'::jsonb
    ELSE jsonb_build_object(
      'type', 'doc',
      'content', jsonb_build_array(
        jsonb_build_object(
          'type', 'paragraph',
          'content', jsonb_build_array(
            jsonb_build_object('type', 'text', 'text', "content")
          )
        )
      )
    )
  END;--> statement-breakpoint
ALTER TABLE "document_specifications" ADD CONSTRAINT "document_specifications_content_check" CHECK (jsonb_typeof("document_specifications"."content") = 'object' AND "document_specifications"."content"->>'type' = 'doc' AND ("document_specifications"."content"->'content' IS NULL OR jsonb_typeof("document_specifications"."content"->'content') = 'array'));
