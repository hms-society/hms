import { ConflictError } from '#shared/domain/errors/conflict-error'

export class CollaboratorEmailAlreadyExistsError extends ConflictError {
  constructor() {
    super('Já existe uma conta com este e-mail.')
  }
}
