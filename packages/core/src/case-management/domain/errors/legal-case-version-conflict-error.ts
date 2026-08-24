import { ConflictError } from '#shared/domain/errors/conflict-error'

export class LegalCaseVersionConflictError extends ConflictError {
  constructor() {
    super('O caso foi alterado por outro usuário. Atualize a página e tente novamente.')
  }
}
