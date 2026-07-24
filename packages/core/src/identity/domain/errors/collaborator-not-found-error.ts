import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class CollaboratorNotFoundError extends NotFoundError {
  constructor() {
    super('Colaborador não encontrado.')
  }
}
