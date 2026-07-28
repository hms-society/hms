import {
  pgTable,
  uuid,
  varchar,
  boolean,
  timestamp,
  text,
  jsonb,
  pgEnum,
} from 'drizzle-orm/pg-core'

export const usuarioTipoEnum = pgEnum('usuario_tipo', [
  'interno',
  'externo_cliente',
  'externo_terceiro',
  'externo_advogado',
])

export const usuario = pgTable('usuario', {
  id: uuid('id').defaultRandom().primaryKey(),
  nome: varchar('nome', { length: 200 }).notNull(),
  email: varchar('email', { length: 254 }).notNull().unique(),
  senhaHash: varchar('senha_hash', { length: 255 }).notNull(),
  perfilTecnicoId: uuid('perfil_tecnico_id').notNull(),
  cargoFuncaoId: uuid('cargo_funcao_id'),
  tipo: usuarioTipoEnum('tipo').notNull(),
  ativo: boolean('ativo').notNull().default(true),
  permissaoTemporaria: boolean('permissao_temporaria').notNull().default(false),
  permissaoValidade: timestamp('permissao_validade', { withTimezone: true }),
  permissaoJustificativa: text('permissao_justificativa'),
  permissaoAprovadorId: uuid('permissao_aprovador_id'),
  escopoJson: jsonb('escopo_json'),
  bloqueadoEm: timestamp('bloqueado_em', { withTimezone: true }),
  ultimoAcessoEm: timestamp('ultimo_acesso_em', { withTimezone: true }),
  criadoEm: timestamp('criado_em', { withTimezone: true }).notNull().defaultNow(),
  criadoPor: uuid('criado_por').notNull(),
})
