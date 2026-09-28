DO $migration$
DECLARE
  has_contexts boolean;
  has_legal_area_id boolean;
BEGIN
  IF to_regclass('public.dynamic_forms') IS NULL THEN
    RETURN;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dynamic_forms'
      AND column_name = 'contexts'
  ) INTO has_contexts;

  SELECT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dynamic_forms'
      AND column_name = 'legal_area_id'
  ) INTO has_legal_area_id;

  IF NOT has_contexts THEN
    ALTER TABLE public.dynamic_forms ADD COLUMN contexts jsonb;

    IF has_legal_area_id AND to_regclass('public.dynamic_form_legal_topics') IS NOT NULL THEN
      EXECUTE $backfill$
        UPDATE public.dynamic_forms AS dynamic_form
        SET contexts = jsonb_build_array(
          jsonb_build_object(
            'type', 'legal',
            'data', jsonb_build_object(
              'legalAreaId', dynamic_form.legal_area_id,
              'legalTopicIds', COALESCE(
                (
                  SELECT jsonb_agg(topic.legal_topic_id ORDER BY topic.position)
                  FROM public.dynamic_form_legal_topics AS topic
                  WHERE topic.dynamic_form_id = dynamic_form.id
                ),
                '[]'::jsonb
              )
            )
          )
        )
        WHERE dynamic_form.contexts IS NULL
      $backfill$;
    ELSIF has_legal_area_id THEN
      UPDATE public.dynamic_forms
      SET contexts = jsonb_build_array(
        jsonb_build_object(
          'type', 'legal',
          'data', jsonb_build_object(
            'legalAreaId', legal_area_id,
            'legalTopicIds', '[]'::jsonb
          )
        )
      )
      WHERE contexts IS NULL;
    ELSE
      UPDATE public.dynamic_forms
      SET contexts = '[]'::jsonb
      WHERE contexts IS NULL;
    END IF;

  END IF;

  UPDATE public.dynamic_forms SET contexts = '[]'::jsonb WHERE contexts IS NULL;
  ALTER TABLE public.dynamic_forms ALTER COLUMN contexts SET NOT NULL;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dynamic_forms'
      AND column_name = 'normalized_name'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.dynamic_forms ALTER COLUMN normalized_name DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dynamic_forms'
      AND column_name = 'stage'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.dynamic_forms ALTER COLUMN stage DROP NOT NULL;
  END IF;

  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'dynamic_forms'
      AND column_name = 'legal_area_id'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE public.dynamic_forms ALTER COLUMN legal_area_id DROP NOT NULL;
  END IF;
END;
$migration$;
