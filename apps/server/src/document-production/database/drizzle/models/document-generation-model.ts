import { sql } from 'drizzle-orm'
import type {
  DocumentGenerationFinding,
  DocumentGenerationSource,
  DocumentGenerationTemplate,
} from '@hms/core/document-production/domain/structures'
import {
  check,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const documentGenerationModel = pgTable(
  'document_generations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    documentId: uuid('document_id').notNull(),
    documentSpecificationVersionId: uuid('document_specification_version_id').notNull(),
    requestedByCollaboratorId: uuid('requested_by_collaborator_id').notNull(),
    source: jsonb('source').$type<DocumentGenerationSource>().notNull(),
    template: jsonb('template').$type<DocumentGenerationTemplate>().notNull(),
    status: text('status').notNull(),
    attemptsCount: integer('attempts_count').notNull(),
    findings: jsonb('findings').$type<readonly DocumentGenerationFinding[]>().notNull(),
    documentVersionId: uuid('document_version_id'),
    failureMessage: text('failure_message'),
    startedAt: timestamp('started_at', { withTimezone: true, mode: 'date' }),
    completedAt: timestamp('completed_at', { withTimezone: true, mode: 'date' }),
    failedAt: timestamp('failed_at', { withTimezone: true, mode: 'date' }),
    cancelledAt: timestamp('cancelled_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'document_generations_status_check',
      sql`${table.status} in ('pending', 'running', 'completed', 'failed', 'cancelled')`,
    ),
    check(
      'document_generations_attempts_count_check',
      sql`${table.attemptsCount} between 0 and 3`,
    ),
    check(
      'document_generations_source_check',
      sql`jsonb_typeof(${table.source}) = 'object'`,
    ),
    check(
      'document_generations_template_check',
      sql`jsonb_typeof(${table.template}) = 'object'`,
    ),
    check(
      'document_generations_findings_check',
      sql`jsonb_typeof(${table.findings}) = 'array'`,
    ),
    index('document_generations_document_id_idx').on(table.documentId),
    index('document_generations_status_idx').on(table.status),
  ],
)
