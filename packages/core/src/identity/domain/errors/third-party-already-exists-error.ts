import { ConflictError } from '#shared/domain/errors/conflict-error'

export class ThirdPartyAlreadyExistsError extends ConflictError {
  constructor() {
    super('Já existe um terceiro cadastrado com o documento informado.')
  }
}
