-- Set passwords for the internal Supabase roles to POSTGRES_PASSWORD.
-- The roles themselves are created by the supabase/postgres image on first
-- init; here we only align their passwords with the configured secret so the
-- Auth, Storage and PostgREST services can connect.
--
-- NOTE: for staging/production, managed Supabase handles this — these
-- credentials are for local development only.

\set pgpass `echo "$POSTGRES_PASSWORD"`

ALTER USER authenticator WITH PASSWORD :'pgpass';
ALTER USER pgbouncer WITH PASSWORD :'pgpass';
ALTER USER supabase_auth_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_storage_admin WITH PASSWORD :'pgpass';
ALTER USER supabase_read_only_user WITH PASSWORD :'pgpass';
