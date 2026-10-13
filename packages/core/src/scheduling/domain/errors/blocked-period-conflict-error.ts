import { ConflictError } from '#shared/domain/errors/conflict-error'

export class BlockedPeriodConflictError extends ConflictError {
  constructor() {
    super('Já existe um bloqueio para o período informado.')
  }
}
