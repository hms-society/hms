import type {
  DynamicFormContext,
  DynamicFormField,
  DynamicFormStatus,
} from '@hms/core/shared/domain'
import { sql } from 'drizzle-orm'
import { check, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const dynamicFormModel = pgTable(
  'dynamic_forms',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description'),
    status: text('status').$type<DynamicFormStatus>().notNull(),
    contexts: jsonb('contexts').$type<DynamicFormContext[]>().notNull(),
    fields: jsonb('fields').$type<DynamicFormField[]>().notNull(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    check(
      'dynamic_forms_status_check',
      sql`${table.status} in ('available', 'unavailable')`,
    ),
  ],
)
