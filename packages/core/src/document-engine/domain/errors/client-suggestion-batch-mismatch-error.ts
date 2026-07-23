import { ConflictError } from '#shared/domain/errors/conflict-error'

export class ClientSuggestionBatchMismatchError extends ConflictError {
  constructor() {
    super('A sugestão de cliente não pertence ao lote informado.')
  }
}
