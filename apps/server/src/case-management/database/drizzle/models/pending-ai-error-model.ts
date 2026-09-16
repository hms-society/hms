import { pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'
import { pendingModel } from './pending-model'

export const pendingAiErrorModel = pgTable('pending_ai_errors', {
  id: uuid('id').defaultRandom().primaryKey(),
  pendingId: uuid('pending_id').references(() => pendingModel.id, { onDelete: 'cascade' }).notNull(),
  reason: text('reason').notNull(),
  recordedBy: uuid('recorded_by').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).defaultNow().notNull(),
})
