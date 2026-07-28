import { pgTable, uuid, jsonb, varchar, text, timestamp } from 'drizzle-orm/pg-core'

export const integracaoEvento = pgTable('integracao_evento', {
  id: uuid('id').defaultRandom().primaryKey(),
  provedor: varchar('provedor', { length: 50 }).notNull(),
  payload: jsonb('payload').notNull(),
  status: varchar('status', { length: 30 }).notNull(), // 'sucesso', 'falha_transitoria', 'falha_definitiva'
  erro: text('erro'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})
