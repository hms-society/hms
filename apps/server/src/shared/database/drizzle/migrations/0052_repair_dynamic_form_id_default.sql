DO $migration$
BEGIN
  IF to_regclass('public.dynamic_forms') IS NOT NULL THEN
    ALTER TABLE public.dynamic_forms
      ALTER COLUMN id SET DEFAULT gen_random_uuid();
  END IF;
END;
$migration$;
