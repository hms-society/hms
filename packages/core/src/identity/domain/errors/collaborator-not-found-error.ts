import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class CollaboratorNotFoundError extends NotFoundError {
  constructor() {
    super('Colaborador não encontrado.')
  }
}
