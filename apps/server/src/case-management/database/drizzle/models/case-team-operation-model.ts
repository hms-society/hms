import { jsonb, pgTable, text, timestamp, uniqueIndex, uuid } from 'drizzle-orm/pg-core'
import type { CaseTeamMutationResult } from '@hms/core/case-management/domain/structures'
import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'

export const caseTeamOperationModel = pgTable(
  'case_team_operations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => legalCaseModel.id, { onDelete: 'restrict' }),
    actorId: uuid('actor_id').notNull(),
    operationId: uuid('operation_id').notNull(),
    fingerprint: text('fingerprint').notNull(),
    result: jsonb('result').$type<CaseTeamMutationResult>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull(),
  },
  (table) => [
    uniqueIndex('case_team_operations_key_uidx').on(
      table.caseId,
      table.actorId,
      table.operationId,
    ),
  ],
)
