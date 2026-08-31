import { index, pgTable, text, timestamp, uuid, pgEnum } from 'drizzle-orm/pg-core' // Alterado PgEnum para pgEnum

export const classificacaoAcessoEnum = pgEnum('classificacao_acesso', [
  'INTERNO',
  'CLIENTE',
  'RESTRITO',
  'CONFIDENCIAL',
  'PARCEIRO_LIBERADO',
])

export const documentModel = pgTable(
  'documents',
  {
    id: uuid('id').primaryKey(),
    title: text('title').notNull(),
    classificacaoAcesso: classificacaoAcessoEnum('classificacao_acesso')
      .default('INTERNO')
      .notNull(),

    currentVersionId: uuid('current_version_id'),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' })
      .defaultNow()
      .notNull(),
  },
  (table) => [index('documents_current_version_id_idx').on(table.currentVersionId)],
)
