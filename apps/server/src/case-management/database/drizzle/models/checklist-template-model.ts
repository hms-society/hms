import { sql } from 'drizzle-orm'
import {
  check,
  index,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const checklistTemplateModel = pgTable(
  'checklist_templates',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedBy: uuid('updated_by'),
  },
  (table) => [
    index('checklist_templates_updated_at_idx').on(table.updatedAt),
    check(
      'checklist_templates_name_not_blank_check',
      sql`char_length(btrim(${table.name})) > 0`,
    ),
  ],
)
