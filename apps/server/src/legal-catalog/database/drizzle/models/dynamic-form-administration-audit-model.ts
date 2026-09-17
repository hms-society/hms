import type { DynamicFormAuditDetails } from '@hms/core/legal-catalog/domain/structures'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  jsonb,
  pgTable,
  timestamp,
  uniqueIndex,
  uuid,
  text,
} from 'drizzle-orm/pg-core'

export const dynamicFormAdministrationAuditModel = pgTable(
  'dynamic_form_administration_audit_entries',
  {
    id: uuid('id').primaryKey(),
    dynamicFormId: uuid('dynamic_form_id').notNull(),
    actorCollaboratorId: uuid('actor_collaborator_id').notNull(),
    action: text('action').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    operationKey: uuid('operation_key'),
    details: jsonb('details').$type<DynamicFormAuditDetails>().notNull(),
  },
  (table) => [
    uniqueIndex('dynamic_form_admin_audit_operation_unique')
      .on(table.operationKey)
      .where(sql`${table.operationKey} is not null`),
    index('dynamic_form_admin_audit_form_time_idx').on(
      table.dynamicFormId,
      table.occurredAt,
    ),
    check(
      'dynamic_form_admin_audit_action_check',
      sql`${table.action} in ('duplicated', 'availability_changed', 'deleted', 'created', 'updated')`,
    ),
  ],
)
