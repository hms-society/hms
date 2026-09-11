import { ConflictError } from '#shared/domain/errors'

export class LegalAreaAlreadyExistsError extends ConflictError {
  constructor() {
    super('Já existe uma área do direito com este nome.')
  }
}
