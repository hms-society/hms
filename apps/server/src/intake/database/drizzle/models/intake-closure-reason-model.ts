import { pgEnum } from 'drizzle-orm/pg-core'

export const intakeClosureReasonModel = pgEnum('intake_closure_reason', [
  'fora_do_escopo',
  'inviavel_juridicamente',
  'cliente_desistiu',
  'sem_contato',
  'nao_compareceu',
  'encaminhado',
  'outro',
])
