import { sql } from 'drizzle-orm'
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core'

export const documentSpecificationModel = pgTable(
  'document_specifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    description: text('description').notNull(),
    content: text('content').notNull(),
    variables: jsonb('variables').$type<unknown[]>().notNull().default([]),
    moment: text('moment').notNull(),
    scope: text('scope').notNull(),
    isRequired: boolean('is_required').notNull().default(false),
    status: text('status').notNull().default('available'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check(
      'document_specifications_moment_check',
      sql`${table.moment} in ('consultation', 'formalization', 'legal_production')`,
    ),
    check(
      'document_specifications_scope_check',
      sql`${table.scope} in ('global', 'legal_context')`,
    ),
    check(
      'document_specifications_status_check',
      sql`${table.status} in ('available', 'unavailable')`,
    ),
    check(
      'document_specifications_variables_check',
      sql`jsonb_typeof(${table.variables}) = 'array'`,
    ),
    index('document_specifications_name_normalized_idx').on(
      sql`lower(trim(${table.name}))`,
    ),
    index('document_specifications_moment_idx').on(table.moment),
    index('document_specifications_status_idx').on(table.status),
  ],
)
