import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class MessageNotFoundError extends NotFoundError {
  constructor() {
    super('Mensagem não encontrada.')
  }
}
