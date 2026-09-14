import { sql } from 'drizzle-orm'
import {
  check,
  integer,
  pgTable,
  primaryKey,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { legalTopicModel } from '@/legal-catalog/database/drizzle/models/legal-topic-model'
import { dynamicFormModel } from '@/legal-catalog/database/drizzle/models/dynamic-form-model'

export const dynamicFormLegalTopicModel = pgTable(
  'dynamic_form_legal_topics',
  {
    dynamicFormId: uuid('dynamic_form_id')
      .notNull()
      .references(() => dynamicFormModel.id, { onDelete: 'cascade' }),
    legalTopicId: uuid('legal_topic_id')
      .notNull()
      .references(() => legalTopicModel.id, { onDelete: 'restrict' }),
    position: integer('position').notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.dynamicFormId, table.legalTopicId] }),
    uniqueIndex('dynamic_form_legal_topics_position_unique').on(
      table.dynamicFormId,
      table.position,
    ),
    check('dynamic_form_legal_topics_position_check', sql`${table.position} >= 0`),
  ],
)
