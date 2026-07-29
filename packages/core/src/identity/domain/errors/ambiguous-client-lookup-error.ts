import { ConflictError } from '#shared/domain/errors/conflict-error'

export class AmbiguousClientLookupError extends ConflictError {
  constructor() {
    super('Mais de um cliente foi encontrado para o telefone informado.')
  }
}
