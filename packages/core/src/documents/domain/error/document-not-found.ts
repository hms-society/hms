import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class DocumentFileNotFoundError extends NotFoundError {
  constructor() {
    super('Arquivo de documento não encontrado.')
  }
}