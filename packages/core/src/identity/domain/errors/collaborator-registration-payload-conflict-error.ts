import { ConflictError } from '#shared/domain/errors/conflict-error'

export class CollaboratorRegistrationPayloadConflictError extends ConflictError {
  constructor() {
    super('Já existe uma tentativa de cadastro diferente para este e-mail.')
  }
}
