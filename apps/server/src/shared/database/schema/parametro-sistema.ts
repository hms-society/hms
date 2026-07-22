import { pgTable, uuid, varchar, jsonb, boolean, timestamp, text} from 'drizzle-orm/pg-core'

export const parametroSistema = pgTable('parametro_sistema', {
    id: uuid('id').defaultRandom().primaryKey(),
    chave: varchar('chave',{length: 150}).notNull().unique(),
    valor_json: jsonb('valor_json').notNull(),
    descricao: text('descricao'),
    categoria: varchar('categoria', {length: 80}),
    editalvelEmRuntime: boolean('editavel_em_runtime').notNull().default(false),
    atualizadoEm: timestamp('atualizado_em', {withTimezone: true}).notNull().defaultNow()
})

