import { NotFoundError } from '#shared/domain/errors'

export class LegalTopicNotFoundError extends NotFoundError {
  constructor() {
    super('Tipo de demanda não encontrado.')
  }
}
