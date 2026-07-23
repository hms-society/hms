import { pgTable, uuid, integer, timestamp } from 'drizzle-orm/pg-core'

export const segurancaUsuario = pgTable('seguranca_usuario', {
  usuarioId: uuid('usuario_id').primaryKey().notNull(),
  tentativasFalhas: integer('tentativas_falhas').default(0).notNull(),
  bloqueadoAte: timestamp('bloqueado_ate', { withTimezone: true }),
  sessaoAtivaId: uuid('sessao_ativa_id'),
})