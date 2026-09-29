import { sql } from 'drizzle-orm'
import { check, index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

import { consultationModel } from '@/consultation/database/drizzle/models/consultation-model'

export const consultationOutboxEventModel = pgTable(
  'consultation_outbox_events',
  {
    id: uuid('id').primaryKey(),
    consultationId: uuid('consultation_id')
      .notNull()
      .references(() => consultationModel.id, { onDelete: 'restrict' }),
    name: text('name').notNull(),
    payload: jsonb('payload').$type<Record<string, string>>().notNull(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' }).notNull(),
    publishedAt: timestamp('published_at', { withTimezone: true, mode: 'date' }),
  },
  (table) => [
    index('consultation_outbox_pending_idx')
      .on(table.occurredAt, table.id)
      .where(sql`${table.publishedAt} is null`),
    index('consultation_outbox_consultation_occurrence_idx').on(
      table.consultationId,
      table.occurredAt,
      table.id,
    ),
    check(
      'consultation_outbox_name_check',
      sql`${table.name} in ('consultation/consultation.completed', 'consultation/consultation.legal-context-updated')`,
    ),
    check(
      'consultation_outbox_payload_check',
      sql`jsonb_typeof(${table.payload}) = 'object'`,
    ),
  ],
)
