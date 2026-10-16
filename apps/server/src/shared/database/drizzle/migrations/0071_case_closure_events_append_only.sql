-- Custom SQL migration file, put your code below! --
CREATE OR REPLACE FUNCTION "prevent_case_closure_event_mutation"()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Case closure events are immutable.'
    USING ERRCODE = '55000';
END;
$$;
--> statement-breakpoint

CREATE TRIGGER "case_closure_events_append_only"
BEFORE UPDATE OR DELETE ON "case_closure_events"
FOR EACH ROW
EXECUTE FUNCTION "prevent_case_closure_event_mutation"();
