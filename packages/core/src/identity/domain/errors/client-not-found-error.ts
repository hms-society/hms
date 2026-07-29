import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ClientNotFoundError extends NotFoundError {
  constructor() {
    super('Cliente não encontrado.')
  }
}
