import { pgTable, uuid, text, timestamp, jsonb } from 'drizzle-orm/pg-core'

export const aiSuggestionModel = pgTable('ai_suggestions', {
  id: uuid('id').defaultRandom().primaryKey(),
  entityId: uuid('entity_id').notNull(),
  entityType: text('entity_type').notNull(),
  suggestionType: text('suggestion_type').notNull(),
  content: text('content').notNull(),
  adjustedContent: text('adjusted_content'),
  rejectionReason: text('rejection_reason'),
  confidence: text('confidence'),
  status: text('status').notNull().default('pending'),
  metadata: jsonb('metadata'),
  reviewedBy: uuid('reviewed_by'),
  reviewedAt: timestamp('reviewed_at', { withTimezone: true }),
  suggestedAt: timestamp('suggested_at', { withTimezone: true }).defaultNow().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
})
