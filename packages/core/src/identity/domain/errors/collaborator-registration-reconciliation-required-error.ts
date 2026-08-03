import { ConflictError } from '#shared/domain/errors/conflict-error'

export class CollaboratorRegistrationReconciliationRequiredError extends ConflictError {
  constructor() {
    super('O cadastro precisa de reconciliação antes de continuar.')
  }
}
