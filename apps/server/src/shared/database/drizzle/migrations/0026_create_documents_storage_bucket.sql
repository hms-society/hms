DO $$
BEGIN
  IF to_regclass('storage.buckets') IS NOT NULL THEN
    EXECUTE '
      INSERT INTO "storage"."buckets" ("id", "name", "public")
      VALUES (''documents'', ''documents'', false)
      ON CONFLICT ("id") DO NOTHING
    ';
  END IF;
END $$;
