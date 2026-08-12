import { relations } from 'drizzle-orm'
import { jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { clientModel } from '@/identity/database/drizzle/models/client-model'
import { collaboratorModel } from '@/identity/database/drizzle/models/collaborator-model'
import { legalAreaModel } from '@/legal-catalog/database/drizzle/models/legal-area-model'
import { legalTopicModel } from '@/legal-catalog/database/drizzle/models/legal-topic-model'
import { intakeModel } from '@/intake/database/drizzle/models/intake-model'

export const consultationModel = pgTable('consultations', {
  id: uuid('id').defaultRandom().primaryKey(),
  appointmentId: uuid('appointment_id'),
  intakeId: uuid('intake_id').references(() => intakeModel.id),
  clientId: uuid('client_id')
    .notNull()
    .references(() => clientModel.id),
  assignedLawyerId: uuid('assigned_lawyer_id')
    .notNull()
    .references(() => collaboratorModel.id),

  legalAreaId: uuid('legal_area_id')
    .notNull()
    .references(() => legalAreaModel.id),
  legalTopicId: uuid('legal_topic_id')
    .notNull()
    .references(() => legalTopicModel.id),

  status: text('status').notNull(),
  modality: text('modality').notNull(),
  channel: text('channel'),

  templateId: uuid('template_id'),
  templateAnswers: jsonb('template_answers'),
  primaryLegalQuestion: text('primary_legal_question'),
  guidanceProvided: text('guidance_provided'),
  notes: text('notes'),
  viability: text('viability'),
  decision: text('decision'),

  startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
  completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
  noShowAt: timestamp('no_show_at', { withTimezone: true, mode: 'date' }),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})

export const consultationRelevantFactModel = pgTable('consultation_relevant_facts', {
  id: uuid('id').defaultRandom().primaryKey(),
  consultationId: uuid('consultation_id')
    .notNull()
    .references(() => consultationModel.id, { onDelete: 'cascade' }),
  description: text('description').notNull(),
  occurredOn: timestamp('occurred_on', { withTimezone: true, mode: 'date' }),
})

export const consultationPotentialLegalRequestModel = pgTable(
  'consultation_potential_legal_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultationModel.id, { onDelete: 'cascade' }),
    description: text('description').notNull(),
    summary: text('summary'),
  },
)

export const consultationSuggestionModel = pgTable('consultation_suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  consultationId: uuid('consultation_id')
    .notNull()
    .references(() => consultationModel.id, { onDelete: 'cascade' }),
  target: text('target').notNull(),
  content: text('content').notNull(),
  status: text('status').notNull(),
  suggestedAt: timestamp('suggested_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true, mode: 'date' }),
  reviewedByCollaboratorId: uuid('reviewed_by_collaborator_id').references(
    () => collaboratorModel.id,
  ),
})

export const consultationRelations = relations(consultationModel, ({ one, many }) => ({
  assignedLawyer: one(collaboratorModel, {
    fields: [consultationModel.assignedLawyerId],
    references: [collaboratorModel.id],
  }),
  intake: one(intakeModel, {
    fields: [consultationModel.intakeId],
    references: [intakeModel.id],
  }),
  client: one(clientModel, {
    fields: [consultationModel.clientId],
    references: [clientModel.id],
  }),
  legalArea: one(legalAreaModel, {
    fields: [consultationModel.legalAreaId],
    references: [legalAreaModel.id],
  }),
  legalTopic: one(legalTopicModel, {
    fields: [consultationModel.legalTopicId],
    references: [legalTopicModel.id],
  }),

  facts: many(consultationRelevantFactModel),
  potentialRequests: many(consultationPotentialLegalRequestModel),
  suggestions: many(consultationSuggestionModel),
}))

export const consultationRelevantFactRelations = relations(
  consultationRelevantFactModel,
  ({ one }) => ({
    consultation: one(consultationModel, {
      fields: [consultationRelevantFactModel.consultationId],
      references: [consultationModel.id],
    }),
  }),
)

export const consultationPotentialLegalRequestRelations = relations(
  consultationPotentialLegalRequestModel,
  ({ one }) => ({
    consultation: one(consultationModel, {
      fields: [consultationPotentialLegalRequestModel.consultationId],
      references: [consultationModel.id],
    }),
  }),
)

export const consultationSuggestionRelations = relations(
  consultationSuggestionModel,
  ({ one }) => ({
    consultation: one(consultationModel, {
      fields: [consultationSuggestionModel.consultationId],
      references: [consultationModel.id],
    }),
  }),
)
