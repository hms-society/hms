import { pgTable, uuid, text, timestamp } from 'drizzle-orm/pg-core'

export const aiErrorModel = pgTable('ai_errors', {
  id: uuid('id').defaultRandom().primaryKey(),
  suggestionId: uuid('suggestion_id').notNull(),
  entityId: uuid('entity_id').notNull(),
  suggestionType: text('suggestion_type').notNull(),
  suggestedContent: text('suggested_content').notNull(),
  rejectionReason: text('rejection_reason').notNull(),
  createdByCollaboratorId: uuid('created_by_collaborator_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
})
