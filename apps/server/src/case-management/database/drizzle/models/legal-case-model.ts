import { sql } from 'drizzle-orm'
import {
  check,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from 'drizzle-orm/pg-core'

import { legalCaseStatusModel } from '@/case-management/database/drizzle/models/legal-case-status-model'

export const legalCaseModel = pgTable(
  'cases',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    publicCode: text('public_code').notNull(),
    clientId: uuid('client_id').notNull(),
    intakeId: uuid('intake_id').notNull(),
    legalAreaId: uuid('legal_area_id').notNull(),
    legalTopicId: uuid('legal_topic_id').notNull(),
    title: text('title').notNull(),
    status: legalCaseStatusModel('status').default('documentation').notNull(),
    openedAt: timestamp('opened_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    version: integer('version').default(1).notNull(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex('cases_public_code_uidx').on(table.publicCode),
    uniqueIndex('cases_intake_id_uidx').on(table.intakeId),
    index('cases_client_status_idx').on(table.clientId, table.status),
    index('cases_opened_at_idx').on(table.openedAt),
    check('cases_version_positive_check', sql`${table.version} > 0`),
    check(
      'cases_public_code_format_check',
      sql`${table.publicCode} ~ '^CASO-[0-9]{8}-[0-9]{4}$'`,
    ),
    check(
      'cases_public_code_not_blank_check',
      sql`char_length(btrim(${table.publicCode})) > 0`,
    ),
    check('cases_title_not_blank_check', sql`char_length(btrim(${table.title})) > 0`),
    check(
      'cases_updated_after_created_check',
      sql`${table.updatedAt} >= ${table.createdAt}`,
    ),
  ],
)
