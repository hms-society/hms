import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ClientSuggestionNotFoundError extends NotFoundError {
  constructor() {
    super('Sugestão de cliente não encontrada.')
  }
}
