import { ConflictError } from '#shared/domain/errors/conflict-error'

export class InvalidClientSuggestionStatusError extends ConflictError {
  constructor() {
    super('A sugestão de cliente já foi revisada.')
  }
}
