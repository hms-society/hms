import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'
import { documentModel, classificacaoAcessoEnum } from './document-model'

export const documentAuditModel = pgTable('auditoria_documentos', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentoId: uuid('documento_id')
    .references(() => documentModel.id, { onDelete: 'cascade' })
    .notNull(),
  usuarioResponsavelId: uuid('usuario_responsavel_id').notNull(),
  valorAnterior: classificacaoAcessoEnum('valor_anterior').notNull(),
  valorNovo: classificacaoAcessoEnum('valor_novo').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})

export const documentExternalAccessLogModel = pgTable('logs_acesso_externo', {
  id: uuid('id').defaultRandom().primaryKey(),
  documentoId: uuid('documento_id')
    .references(() => documentModel.id, { onDelete: 'cascade' })
    .notNull(),
  ipOrigem: varchar('ip_origem', { length: 45 }).notNull(),
  tokenUtilizado: text('token_utilizado'),
  motivoNegativa: text('motivo_negativa').notNull(),
  dataHora: timestamp('data_hora', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})
