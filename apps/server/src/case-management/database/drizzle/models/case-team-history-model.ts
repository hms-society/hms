import {
  index,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  integer,
  uniqueIndex,
} from 'drizzle-orm/pg-core'
import { sql } from 'drizzle-orm'
import type {
  CaseEligibilitySnapshot,
  CaseMemberRole,
} from '@hms/core/case-management/domain/structures'
import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'
import { caseMemberModel } from '@/case-management/database/drizzle/models/case-member-model'

export const caseTeamHistoryKindModel = pgEnum('case_team_history_kind', [
  'added',
  'removed',
  'role_changed',
  'eligibility_changed',
  'legacy_imported',
])

export const caseTeamHistoryModel = pgTable(
  'case_team_history',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .notNull()
      .references(() => legalCaseModel.id, { onDelete: 'restrict' }),
    membershipId: uuid('membership_id')
      .notNull()
      .references(() => caseMemberModel.id, { onDelete: 'restrict' }),
    collaboratorId: uuid('collaborator_id').notNull(),
    actorId: uuid('actor_id'),
    kind: caseTeamHistoryKindModel('kind').notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    teamVersion: integer('team_version').notNull(),
    previousRole: text('previous_role').$type<CaseMemberRole>(),
    nextRole: text('next_role').$type<CaseMemberRole>(),
    previousEligibility: jsonb('previous_eligibility').$type<CaseEligibilitySnapshot>(),
    nextEligibility: jsonb('next_eligibility').$type<CaseEligibilitySnapshot>(),
    reason: text('reason'),
    operationId: uuid('operation_id'),
    legacy: jsonb('legacy').$type<{
      readonly role: string
      readonly permission: string
      readonly isPrimary: boolean
      readonly assignedAt: Date
      readonly assignedBy: string
      readonly createdAt: Date
    }>(),
  },
  (table) => [
    index('case_team_history_case_occurred_id_idx').on(
      table.caseId,
      table.occurredAt,
      table.id,
    ),
    uniqueIndex('case_team_history_operation_uidx')
      .on(table.caseId, table.operationId, table.membershipId, table.kind)
      .where(
        sql`${table.operationId} IS NOT NULL AND ${table.kind} <> 'legacy_imported'`,
      ),
    uniqueIndex('case_team_history_legacy_membership_uidx')
      .on(table.membershipId)
      .where(sql`${table.kind} = 'legacy_imported'`),
  ],
)
