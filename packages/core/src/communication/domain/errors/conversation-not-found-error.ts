import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ConversationNotFoundError extends NotFoundError {
  constructor() {
    super('Conversa não encontrada.')
  }
}
