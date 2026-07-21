import { index, jsonb, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core'

export const integracaoEventos = pgTable(
  'integracao_eventos',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    provedor: text('provedor').notNull(),
    tipoEvento: text('tipo_evento').notNull(),
    idExterno: text('id_externo'),
    payload: jsonb('payload').notNull(),
    status: text('status').default('RECEBIDO').notNull(),
    criadoEm: timestamp('criado_em', { withTimezone: true }).defaultNow().notNull(),
    atualizadoEm: timestamp('atualizado_em', { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index('idx_integracao_eventos_id_externo').on(table.idExterno),
    index('idx_integracao_eventos_provedor_status').on(table.provedor, table.status),
  ]
)

export type IntegracaoEvento = typeof integracaoEventos.$inferSelect
export type NovoIntegracaoEvento = typeof integracaoEventos.$inferInsert
