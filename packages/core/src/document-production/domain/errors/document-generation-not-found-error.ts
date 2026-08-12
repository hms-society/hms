import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class DocumentGenerationNotFoundError extends NotFoundError {
  constructor() {
    super('Geração documental não encontrada.')
  }
}
