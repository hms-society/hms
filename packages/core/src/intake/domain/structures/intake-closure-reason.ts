export const IntakeClosureReason = {
  OutOfScope: 'fora_do_escopo',
  LegallyUnviable: 'inviavel_juridicamente',
  ClientWithdrew: 'cliente_desistiu',
  UnableToContact: 'sem_contato',
  NoShow: 'nao_compareceu',
  Referred: 'encaminhado',
  Other: 'outro',
} as const

export type IntakeClosureReason =
  (typeof IntakeClosureReason)[keyof typeof IntakeClosureReason]
