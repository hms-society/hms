import { ConflictError } from '#shared/domain/errors'

export class LegalTopicAlreadyExistsError extends ConflictError {
  constructor() {
    super('Já existe um tipo de demanda com este nome nesta área.')
  }
}
