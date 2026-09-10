import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core'

export const auditLogModel = pgTable('log_auditoria', {
  id: uuid('id').defaultRandom().primaryKey(),
  idUsuario: uuid('id_usuario').notNull(),
  perfilUsuario: varchar('perfil_usuario', { length: 50 }).notNull(),
  entidade: varchar('entidade', { length: 50 }).notNull(),
  idEntidade: uuid('id_entidade').notNull(),
  campoAlterado: varchar('campo_alterado', { length: 100 }).notNull(),
  valorAnterior: text('valor_anterior'),
  valorNovo: text('valor_novo'),
  timestamp: timestamp('timestamp', { withTimezone: true, mode: 'date' })
    .defaultNow()
    .notNull(),
})
