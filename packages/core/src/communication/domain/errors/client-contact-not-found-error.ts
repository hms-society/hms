import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ClientContactNotFoundError extends NotFoundError {
  constructor() {
    super('Contato do cliente não encontrado na Comunicação.')
  }
}
