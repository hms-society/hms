import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'

export const aiBlockModel = pgTable('ai_blocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  suggestionId: uuid('suggestion_id').notNull(),
  entityId: uuid('entity_id').notNull(),
  suggestionType: text('suggestion_type').notNull(),
  blockedByCollaboratorId: uuid('blocked_by_collaborator_id').notNull(),
  isUnblocked: boolean('is_unblocked').default(false).notNull(),
  blockedAt: timestamp('blocked_at', { withTimezone: true }).defaultNow().notNull(),
})
