import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { LegalCase } from '@hms/core/case-management/domain/entities'
import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'

export const caseCreationOperationModel = pgTable(
  'case_creation_operations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    intakeId: uuid('intake_id')
      .notNull()
      .references(() => legalCaseModel.intakeId, { onDelete: 'cascade' }),
    actorId: uuid('actor_id').notNull(),
    operationId: uuid('operation_id').notNull(),
    fingerprint: text('fingerprint').notNull(),
    result: jsonb('result').$type<LegalCase>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('case_creation_operations_actor_key_uidx').on(
      table.actorId,
      table.operationId,
    ),
  ],
)
