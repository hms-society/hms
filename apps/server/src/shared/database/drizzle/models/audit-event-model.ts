import {
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core'

export const auditEventModel = pgTable(
  'audit_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    occurredAt: timestamp('occurred_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    actorId: uuid('actor_id'),
    actorProfile: varchar('actor_profile', { length: 50 }),
    entityType: varchar('entity_type', { length: 50 }).notNull(),
    entityId: uuid('entity_id'),
    action: varchar('action', { length: 100 }).notNull(),
    origin: varchar('origin', { length: 20 }).notNull(),
    status: varchar('status', { length: 20 }).notNull(),
    beforeData: jsonb('before_data'),
    afterData: jsonb('after_data'),
    metadata: jsonb('metadata'),
    ipAddress: varchar('ip_address', { length: 45 }),
    justification: text('justification'),
  },
  (table) => [
    index('audit_events_occurred_at_idx').on(table.occurredAt),
    index('audit_events_entity_type_idx').on(table.entityType),
    index('audit_events_entity_id_idx').on(table.entityId),
    index('audit_events_action_idx').on(table.action),
    index('audit_events_origin_idx').on(table.origin),
    index('audit_events_status_idx').on(table.status),
    index('audit_events_actor_id_idx').on(table.actorId),
  ],
)
