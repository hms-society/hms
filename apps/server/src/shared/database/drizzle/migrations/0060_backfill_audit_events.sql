INSERT INTO "audit_events" (
  "id", "occurred_at", "actor_id", "actor_profile", "entity_type", "entity_id",
  "action", "origin", "status", "before_data", "after_data", "metadata"
)
SELECT
  l."id", l."timestamp", l."id_usuario", l."perfil_usuario",
  CASE l."entidade"
    WHEN 'cliente' THEN 'client'
    WHEN 'terceiro' THEN 'third_party'
    WHEN 'permissao' THEN 'permission'
    ELSE l."entidade"
  END,
  l."id_entidade", l."campo_alterado", 'human', 'success',
  CASE WHEN l."valor_anterior" IS NULL THEN NULL ELSE jsonb_build_object('value', l."valor_anterior") END,
  CASE WHEN l."valor_novo" IS NULL THEN NULL ELSE jsonb_build_object('value', l."valor_novo") END,
  jsonb_build_object('source_table', 'log_auditoria')
FROM "log_auditoria" l
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "audit_events" (
  "id", "occurred_at", "actor_id", "entity_type", "entity_id", "action", "origin", "status", "after_data", "metadata"
)
SELECT
  l."id", l."created_at", l."actor_id", 'document_validation', l."document_file_id",
  l."action", CASE WHEN l."actor_id" IS NULL THEN 'system' ELSE 'human' END,
  CASE WHEN l."status"::text IN ('validated', 'approved', 'success') THEN 'success' ELSE 'failure' END,
  jsonb_build_object('status', l."status", 'decision', l."decision", 'reason', l."reason", 'message', l."message", 'metadata', l."metadata"),
  jsonb_build_object('source_table', 'document_validation_logs')
FROM "document_validation_logs" l
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "audit_events" (
  "id", "occurred_at", "actor_id", "entity_type", "entity_id", "action", "origin", "status", "after_data", "metadata"
)
SELECT
  l."id", l."created_at", l."user_id", 'document_exception', l."document_exception_id",
  l."action", 'human', 'success', l."metadata", jsonb_build_object('source_table', 'document_exception_audit_logs')
FROM "document_exception_audit_logs" l
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

INSERT INTO "audit_events" (
  "id", "occurred_at", "entity_type", "entity_id", "action", "origin", "status", "ip_address", "metadata"
)
SELECT
  l."id", l."data_hora", 'external_access', l."documento_id", 'access_denied', 'integration', 'failure',
  l."ip_origem", jsonb_build_object('reason', l."motivo_negativa", 'source_table', 'logs_acesso_externo')
FROM "logs_acesso_externo" l
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "sync_log_auditoria_to_audit_events"()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "audit_events" (
    "id", "occurred_at", "actor_id", "actor_profile", "entity_type", "entity_id",
    "action", "origin", "status", "before_data", "after_data", "metadata"
  ) VALUES (
    NEW."id", NEW."timestamp", NEW."id_usuario", NEW."perfil_usuario",
    CASE NEW."entidade"
      WHEN 'cliente' THEN 'client'
      WHEN 'terceiro' THEN 'third_party'
      WHEN 'permissao' THEN 'permission'
      ELSE NEW."entidade"
    END,
    NEW."id_entidade", NEW."campo_alterado", 'human', 'success',
    CASE WHEN NEW."valor_anterior" IS NULL THEN NULL ELSE jsonb_build_object('value', NEW."valor_anterior") END,
    CASE WHEN NEW."valor_novo" IS NULL THEN NULL ELSE jsonb_build_object('value', NEW."valor_novo") END,
    jsonb_build_object('source_table', 'log_auditoria')
  ) ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "log_auditoria_sync_audit_events"
AFTER INSERT ON "log_auditoria"
FOR EACH ROW EXECUTE FUNCTION "sync_log_auditoria_to_audit_events"();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "sync_document_validation_log_to_audit_events"()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "audit_events" (
    "id", "occurred_at", "actor_id", "entity_type", "entity_id", "action", "origin", "status", "after_data", "metadata"
  ) VALUES (
    NEW."id", NEW."created_at", NEW."actor_id", 'document_validation', NEW."document_file_id", NEW."action",
    CASE WHEN NEW."actor_id" IS NULL THEN 'system' ELSE 'human' END,
    CASE WHEN NEW."status"::text IN ('validated', 'approved', 'success') THEN 'success' ELSE 'failure' END,
    jsonb_build_object('status', NEW."status", 'decision', NEW."decision", 'reason', NEW."reason", 'message', NEW."message", 'metadata', NEW."metadata"),
    jsonb_build_object('source_table', 'document_validation_logs')
  ) ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "document_validation_logs_sync_audit_events"
AFTER INSERT ON "document_validation_logs"
FOR EACH ROW EXECUTE FUNCTION "sync_document_validation_log_to_audit_events"();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "sync_document_exception_log_to_audit_events"()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "audit_events" (
    "id", "occurred_at", "actor_id", "entity_type", "entity_id", "action", "origin", "status", "after_data", "metadata"
  ) VALUES (
    NEW."id", NEW."created_at", NEW."user_id", 'document_exception', NEW."document_exception_id",
    NEW."action", 'human', 'success', NEW."metadata", jsonb_build_object('source_table', 'document_exception_audit_logs')
  ) ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "document_exception_audit_logs_sync_audit_events"
AFTER INSERT ON "document_exception_audit_logs"
FOR EACH ROW EXECUTE FUNCTION "sync_document_exception_log_to_audit_events"();
--> statement-breakpoint

CREATE OR REPLACE FUNCTION "sync_external_access_log_to_audit_events"()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  INSERT INTO "audit_events" (
    "id", "occurred_at", "entity_type", "entity_id", "action", "origin", "status", "ip_address", "metadata"
  ) VALUES (
    NEW."id", NEW."data_hora", 'external_access', NEW."documento_id", 'access_denied', 'integration', 'failure',
    NEW."ip_origem", jsonb_build_object('reason', NEW."motivo_negativa", 'source_table', 'logs_acesso_externo')
  ) ON CONFLICT ("id") DO NOTHING;
  RETURN NEW;
END;
$$;
--> statement-breakpoint
CREATE OR REPLACE TRIGGER "logs_acesso_externo_sync_audit_events"
AFTER INSERT ON "logs_acesso_externo"
FOR EACH ROW EXECUTE FUNCTION "sync_external_access_log_to_audit_events"();
