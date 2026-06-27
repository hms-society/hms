import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class UserNotFoundError extends NotFoundError {
  constructor() {
    super('Usuário não encontrado.')
  }
}
