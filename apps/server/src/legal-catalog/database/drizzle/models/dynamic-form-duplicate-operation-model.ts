import type { DynamicForm } from '@hms/core/legal-catalog/domain/entities'
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const dynamicFormDuplicateOperationModel = pgTable(
  'dynamic_form_duplicate_operations',
  {
    operationKey: uuid('operation_key').primaryKey(),
    sourceDynamicFormId: uuid('source_dynamic_form_id').notNull(),
    requestedNormalizedName: text('requested_normalized_name').notNull(),
    actorCollaboratorId: uuid('actor_collaborator_id').notNull(),
    result: jsonb('result').$type<DynamicForm>().notNull(),
    completedAt: timestamp('completed_at', {
      withTimezone: true,
      mode: 'date',
    }).notNull(),
  },
)
