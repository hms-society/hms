DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('documents', 'documents', false)
    ON CONFLICT (id) DO UPDATE
      SET name = EXCLUDED.name,
          public = EXCLUDED.public;
  END IF;

  IF
    to_regclass('storage.objects') IS NOT NULL
    AND EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
    AND NOT EXISTS (
      SELECT 1
      FROM pg_policies
      WHERE schemaname = 'storage'
        AND tablename = 'objects'
        AND policyname = 'documents_authenticated_select'
    )
  THEN
    CREATE POLICY documents_authenticated_select
      ON storage.objects
      FOR SELECT
      TO authenticated
      USING (bucket_id = 'documents');
  END IF;
END $$;
