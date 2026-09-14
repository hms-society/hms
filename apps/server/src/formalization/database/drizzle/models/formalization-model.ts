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
import { formalizationSignatureRequestStatusModel } from '@/formalization/database/drizzle/models/formalization-signature-request-status-model'

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
    signatureRequestId: uuid('signature_request_id'),
    signatureStatus: formalizationSignatureRequestStatusModel('signature_status'),
    signatureSubmittedAt: timestamp('signature_submitted_at', {
      withTimezone: true,
      mode: 'date',
    }),
    signatureConfirmedAt: timestamp('signature_confirmed_at', {
      withTimezone: true,
      mode: 'date',
    }),
    signatureTerminalAt: timestamp('signature_terminal_at', {
      withTimezone: true,
      mode: 'date',
    }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    completedByCollaboratorId: uuid('completed_by_collaborator_id'),
    contractingConfirmationKey: uuid('contracting_confirmation_key'),
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
    uniqueIndex('formalizations_contracting_confirmation_key_uq')
      .on(table.contractingConfirmationKey)
      .where(sql`${table.contractingConfirmationKey} is not null`),
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
    check(
      'formalizations_completion_check',
      sql`(
        (${table.status} = 'completed' and ${table.completedAt} is not null and ${table.completedByCollaboratorId} is not null and ${table.contractingConfirmationKey} is not null)
        or
        (${table.status} <> 'completed' and ${table.completedAt} is null and ${table.completedByCollaboratorId} is null and ${table.contractingConfirmationKey} is null)
      )`,
    ),
  ],
)
