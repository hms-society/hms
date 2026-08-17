import { sql } from 'drizzle-orm'
import {
  check,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'
import type {
  ConsultationSuggestion,
  IdentifiedRisk,
  PotentialLegalRequest,
  RelevantFact,
} from '@hms/core/consultation/domain/entities'

export const consultationModel = pgTable(
  'consultations',
  {
    id: uuid('id').primaryKey(),
    intakeId: uuid('intake_id').notNull(),
    appointmentId: uuid('appointment_id').notNull(),
    clientId: uuid('client_id').notNull(),
    assignedLawyerId: uuid('assigned_lawyer_id').notNull(),
    legalAreaId: uuid('legal_area_id').notNull(),
    legalTopicId: uuid('legal_topic_id').notNull(),
    primaryLegalQuestion: text('primary_legal_question'),
    guidanceProvided: text('guidance_provided'),
    notes: text('notes'),
    relevantFacts: jsonb('relevant_facts').$type<RelevantFact[]>().default([]).notNull(),
    potentialLegalRequests: jsonb('potential_legal_requests')
      .$type<PotentialLegalRequest[]>()
      .default([])
      .notNull(),
    identifiedRisks: jsonb('identified_risks')
      .$type<IdentifiedRisk[]>()
      .default([])
      .notNull(),
    suggestions: jsonb('suggestions')
      .$type<ConsultationSuggestion[]>()
      .default([])
      .notNull(),
    modality: text('modality').notNull(),
    channel: text('channel'),
    status: text('status').notNull(),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    noShowAt: timestamp('no_show_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('consultations_appointment_id_uq').on(table.appointmentId),
    uniqueIndex('consultations_intake_id_uq').on(table.intakeId),
    check(
      'consultations_modality_check',
      sql`${table.modality} in ('in_person', 'virtual')`,
    ),
    check(
      'consultations_channel_check',
      sql`${table.channel} is null or ${table.channel} in ('whatsapp_video', 'google_meet', 'teams', 'other')`,
    ),
    check(
      'consultations_status_check',
      sql`${table.status} in ('pending', 'in_progress', 'completed', 'no_show')`,
    ),
    check(
      'consultations_modality_channel_check',
      sql`(${table.modality} = 'in_person' and ${table.channel} is null) or (${table.modality} = 'virtual' and ${table.channel} is not null)`,
    ),
  ],
)
