import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

import { checklistTemplateModel } from '@/case-management/database/drizzle/models/checklist-template-model'

export const checklistTemplateItemModel = pgTable(
  'checklist_template_items',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    checklistTemplateId: uuid('checklist_template_id')
      .references(() => checklistTemplateModel.id, { onDelete: 'cascade' })
      .notNull(),

    title: text('title').notNull(),
    documentType: text('document_type').notNull(),
    isRequired: boolean('is_required').default(true).notNull(),

    position: integer('position').default(0).notNull(),

    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedBy: uuid('updated_by'),
  },
  (table) => [
    index('checklist_template_items_template_id_idx').on(table.checklistTemplateId),
    check(
      'checklist_template_items_title_not_blank_check',
      sql`char_length(btrim(${table.title})) > 0`,
    ),
    check(
      'checklist_template_items_document_type_not_blank_check',
      sql`char_length(btrim(${table.documentType})) > 0`,
    ),
    check('checklist_template_items_position_check', sql`${table.position} >= 0`),
  ],
)
