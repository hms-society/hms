import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import type { DynamicFormOperation } from '@hms/core/legal-catalog/domain/structures'
import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const dynamicFormOperationModel = pgTable(
  'dynamic_form_operations',
  {
    operationKey: uuid('operation_key').primaryKey(),
    action: text('action').notNull(),
    actorCollaboratorId: uuid('actor_collaborator_id').notNull(),
    targetDynamicFormId: uuid('target_dynamic_form_id').notNull(),
    expectedVersion: integer('expected_version'),
    canonicalRequest: jsonb('canonical_request')
      .$type<DynamicFormOperation['canonicalRequest']>()
      .notNull(),
    result: jsonb('result').$type<DynamicForm>().notNull(),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
  },
  (table) => [
    index('dynamic_form_operations_target_time_idx').on(
      table.targetDynamicFormId,
      table.completedAt,
    ),
    check(
      'dynamic_form_operations_action_check',
      sql`${table.action} in ('duplicated', 'created', 'updated')`,
    ),
    check(
      'dynamic_form_operations_expected_version_check',
      sql`(
        (${table.action} = 'updated' and ${table.expectedVersion} is not null and ${table.expectedVersion} >= 1)
        or
        (${table.action} <> 'updated' and ${table.expectedVersion} is null)
      )`,
    ),
  ],
)
