import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { caseChecklistGateDecisionModel } from '@/case-management/database/drizzle/models/case-checklist-gate-decision-model'
import { legalCaseStatusModel } from '@/case-management/database/drizzle/models/legal-case-status-model'

export const legalCaseModel = pgTable(
  'cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    publicCode: text('public_code').notNull(),
    clientId: uuid('client_id').notNull(),
    intakeId: uuid('intake_id').notNull(),
    legalAreaId: uuid('legal_area_id').notNull(),
    legalTopicId: uuid('legal_topic_id').notNull(),
    title: text('title').notNull(),
    status: legalCaseStatusModel('status').default('documentation').notNull(),
    checklistGateDecision: caseChecklistGateDecisionModel('checklist_gate_decision'),
    checklistGateDecidedAt: timestamp('checklist_gate_decided_at', {
      withTimezone: true,
      mode: 'date',
    }),
    checklistGateDecidedBy: uuid('checklist_gate_decided_by'),
    checklistGateRemarks: text('checklist_gate_remarks'),
    dossierGateHomologatedAt: timestamp('dossier_gate_homologated_at', {
      withTimezone: true,
      mode: 'date',
    }),
    dossierGateHomologatedBy: uuid('dossier_gate_homologated_by'),
    openedAt: timestamp('opened_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('cases_public_code_uidx').on(table.publicCode),
    uniqueIndex('cases_intake_id_uidx').on(table.intakeId),
    index('cases_client_status_idx').on(table.clientId, table.status),
    index('cases_opened_at_idx').on(table.openedAt),
    check(
      'cases_public_code_format_check',
      sql`${table.publicCode} ~ '^CASO-[0-9]{8}-[0-9]{4}$'`,
    ),
    check(
      'cases_public_code_not_blank_check',
      sql`char_length(btrim(${table.publicCode})) > 0`,
    ),
    check('cases_title_not_blank_check', sql`char_length(btrim(${table.title})) > 0`),
    check(
      'cases_checklist_reason_remarks_check',
      sql`${table.checklistGateDecision} NOT IN ('approved_with_exception', 'blocked_insufficient', 'rejected_on_merit') OR (${table.checklistGateRemarks} IS NOT NULL AND char_length(btrim(${table.checklistGateRemarks})) > 0)`,
    ),
    check(
      'cases_updated_after_created_check',
      sql`${table.updatedAt} >= ${table.createdAt}`,
    ),
  ],
)
