import { ConflictError } from '#shared/domain/errors/conflict-error'

export class CollaboratorAlreadyLinkedError extends ConflictError {
  constructor() {
    super('Esta conta já está vinculada a um colaborador.')
  }
}
