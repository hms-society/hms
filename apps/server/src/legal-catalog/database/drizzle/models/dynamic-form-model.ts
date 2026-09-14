import type { DynamicFormField } from '@hms/core/shared/domain'
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

import { legalAreaModel } from '@/legal-catalog/database/drizzle/models/legal-area-model'

export const dynamicFormModel = pgTable(
  'dynamic_forms',
  {
    id: uuid('id').primaryKey(),
    name: text('name').notNull(),
    normalizedName: text('normalized_name').notNull(),
    description: text('description'),
    status: text('status').notNull(),
    stage: text('stage').notNull(),
    legalAreaId: uuid('legal_area_id')
      .notNull()
      .references(() => legalAreaModel.id, { onDelete: 'restrict' }),
    fields: jsonb('fields').$type<DynamicFormField[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('dynamic_forms_normalized_name_unique').on(table.normalizedName),
    uniqueIndex('dynamic_forms_admin_list_idx').on(
      table.stage,
      table.status,
      table.normalizedName,
      table.id,
    ),
    check(
      'dynamic_forms_status_check',
      sql`${table.status} in ('available', 'unavailable')`,
    ),
    check(
      'dynamic_forms_stage_check',
      sql`${table.stage} in ('consultation', 'formalization')`,
    ),
  ],
)
