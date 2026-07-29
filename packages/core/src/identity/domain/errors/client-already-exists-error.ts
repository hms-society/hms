import { ConflictError } from '#shared/domain/errors/conflict-error'

export class ClientAlreadyExistsError extends ConflictError {
  constructor() {
    super('Já existe um cliente cadastrado com o documento informado.')
  }
}
