import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class ClientNotFoundError extends NotFoundError {
  constructor() {
    super('Cliente não encontrado.')
  }
}
