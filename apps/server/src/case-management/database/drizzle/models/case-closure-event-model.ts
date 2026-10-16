import { sql } from 'drizzle-orm'
import { check, index, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'
import { caseClosureOutcomeModel } from '@/case-management/database/drizzle/models/case-closure-outcome-model'

export const caseClosureEventTypeModel = pgEnum('case_closure_event_type', [
  'closed',
  'reopened',
])

export const caseClosureEventModel = pgTable(
  'case_closure_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => legalCaseModel.id, { onDelete: 'cascade' }),
    type: caseClosureEventTypeModel('type').notNull(),
    actorId: uuid('actor_id').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    outcome: caseClosureOutcomeModel('outcome'),
    notes: text('notes'),
    reason: text('reason'),
  },
  (table) => [
    index('case_closure_events_case_occurred_idx').on(
      table.caseId,
      table.occurredAt,
      table.id,
    ),
    check(
      'case_closure_events_payload_check',
      sql`(${table.type} = 'closed' AND ${table.outcome} IS NOT NULL AND ${table.reason} IS NULL) OR (${table.type} = 'reopened' AND ${table.outcome} IS NULL AND ${table.notes} IS NULL AND ${table.reason} IS NOT NULL AND char_length(btrim(${table.reason})) > 0)`,
    ),
  ],
)
