import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
  boolean,
} from 'drizzle-orm/pg-core'

import { legalAreaModel } from '@/legal-catalog/database/drizzle/models'

export const checklistTemplateModel = pgTable(
  'checklist_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    legalAreaId: uuid('legal_area_id')
      .references(() => legalAreaModel.id, { onDelete: 'restrict' })
      .notNull(),
    name: text('name').notNull(),
    isActive: boolean('is_active').default(true).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedBy: uuid('updated_by'),
  },
  (table) => [
    uniqueIndex('checklist_templates_legal_area_id_uidx').on(table.legalAreaId),
    index('checklist_templates_updated_at_idx').on(table.updatedAt),
    check(
      'checklist_templates_name_not_blank_check',
      sql`char_length(btrim(${table.name})) > 0`,
    ),
  ],
)
