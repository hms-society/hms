import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import type {
  DynamicFormAnswer,
  DynamicFormSnapshot,
} from '@hms/core/shared/domain/structures'

export const formalizationModel = pgTable(
  'formalizations',
  {
    id: uuid('id').primaryKey(),
    intakeId: uuid('intake_id').notNull(),
    clientId: uuid('client_id').notNull(),
    consultationId: uuid('consultation_id').notNull(),
    assignedLawyerId: uuid('assigned_lawyer_id').notNull(),
    legalAreaId: uuid('legal_area_id'),
    legalTopicId: uuid('legal_topic_id'),
    status: text('status').notNull().default('in_progress'),
    contractFormId: uuid('contract_form_id').notNull(),
    contractFormSnapshot: jsonb('contract_form_snapshot')
      .$type<DynamicFormSnapshot>()
      .notNull(),
    contractFormAnswers: jsonb('contract_form_answers')
      .$type<DynamicFormAnswer[]>()
      .notNull()
      .default([]),
    contractFormState: text('contract_form_state').notNull().default('open'),
    contractFormRevision: integer('contract_form_revision').notNull().default(0),
    contractFormClosedAt: timestamp('contract_form_closed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    contractFormClosedByCollaboratorId: uuid('contract_form_closed_by_collaborator_id'),
    documentsConfirmedAt: timestamp('documents_confirmed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    documentsConfirmedByCollaboratorId: uuid('documents_confirmed_by_collaborator_id'),
    documentsConfirmedRevision: integer('documents_confirmed_revision'),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' }),
    cancelledByCollaboratorId: uuid('cancelled_by_collaborator_id'),
    version: integer('version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('formalizations_intake_uq').on(table.intakeId),
    index('formalizations_assigned_lawyer_idx').on(table.assignedLawyerId, table.status),
    check(
      'formalizations_status_check',
      sql`${table.status} in ('in_progress', 'completed', 'cancelled')`,
    ),
    check(
      'formalizations_form_state_check',
      sql`${table.contractFormState} in ('open', 'closed')`,
    ),
    check(
      'formalizations_revision_check',
      sql`${table.contractFormRevision} >= 0 and ${table.version} >= 1`,
    ),
    check(
      'formalizations_confirmation_check',
      sql`(
        (${table.documentsConfirmedAt} is null and ${table.documentsConfirmedByCollaboratorId} is null and ${table.documentsConfirmedRevision} is null)
        or
        (${table.documentsConfirmedAt} is not null and ${table.documentsConfirmedByCollaboratorId} is not null and ${table.documentsConfirmedRevision} is not null)
      )`,
    ),
    check(
      'formalizations_cancellation_check',
      sql`(
        (${table.status} = 'cancelled' and ${table.cancelledAt} is not null and ${table.cancelledByCollaboratorId} is not null)
        or
        (${table.status} <> 'cancelled' and ${table.cancelledAt} is null and ${table.cancelledByCollaboratorId} is null)
      )`,
    ),
  ],
)
