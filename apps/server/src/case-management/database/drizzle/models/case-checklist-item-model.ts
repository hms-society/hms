import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { caseChecklistItemStatusModel } from '@/case-management/database/drizzle/models/case-checklist-item-status-model'
import { legalCaseModel } from '@/case-management/database/drizzle/models/legal-case-model'
import type { ClientDocumentSource } from '@hms/core/document-engine/domain/structures'

export const caseChecklistItemModel = pgTable(
  'case_checklist_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    caseId: uuid('case_id')
      .references(() => legalCaseModel.id, { onDelete: 'cascade' })
      .notNull(),
    templateItemKey: text('template_item_key').notNull(),
    title: text('title').notNull(),
    isRequired: boolean('is_required').default(true).notNull(),
    status: caseChecklistItemStatusModel('status').default('pending').notNull(),
    documentFileId: uuid('document_file_id'),
    documentFileName: text('document_file_name'),
    waiverJustification: text('waiver_justification'),
    waiverActorId: uuid('waiver_actor_id'),
    waiverActorName: text('waiver_actor_name'),
    waivedAt: timestamp('waived_at', { withTimezone: true, mode: 'date' }),
    clientDocumentId: uuid('client_document_id'),
    documentSource: jsonb('document_source').$type<ClientDocumentSource>(),
    documentAttachedAt: timestamp('document_attached_at', {
      withTimezone: true,
      mode: 'date',
    }),
    documentAttachedBy: uuid('document_attached_by'),
    validatedAt: timestamp('validated_at', { withTimezone: true, mode: 'date' }),
    validatedBy: uuid('validated_by'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('case_checklist_items_case_template_key_uidx').on(
      table.caseId,
      table.templateItemKey,
    ),
    index('case_checklist_items_case_status_idx').on(table.caseId, table.status),
    check(
      'case_checklist_items_template_key_not_blank_check',
      sql`char_length(btrim(${table.templateItemKey})) > 0`,
    ),
    check(
      'case_checklist_items_title_not_blank_check',
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    check(
      'case_checklist_items_validated_document_check',
      sql`${table.status} <> 'validated' OR (${table.documentFileId} IS NOT NULL AND ${table.validatedAt} IS NOT NULL AND ${table.validatedBy} IS NOT NULL)`,
    ),
    check(
      'case_checklist_items_waiver_check',
      sql`(${table.waiverJustification} IS NULL AND ${table.waiverActorId} IS NULL AND ${table.waiverActorName} IS NULL AND ${table.waivedAt} IS NULL) OR (${table.waiverJustification} IS NOT NULL AND ${table.waiverActorId} IS NOT NULL AND ${table.waiverActorName} IS NOT NULL AND ${table.waivedAt} IS NOT NULL)`,
    ),
    check(
      'case_checklist_items_client_document_reference_check',
      sql`(${table.clientDocumentId} IS NULL AND ${table.documentSource} IS NULL AND ${table.documentAttachedAt} IS NULL AND ${table.documentAttachedBy} IS NULL) OR (${table.clientDocumentId} IS NOT NULL AND ${table.documentSource} IS NOT NULL AND ${table.documentAttachedAt} IS NOT NULL AND ${table.documentAttachedBy} IS NOT NULL)`,
    ),
  ],
)
