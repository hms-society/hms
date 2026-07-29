import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class DocumentBatchNotFoundError extends NotFoundError {
  constructor() {
    super('Lote documental não encontrado.')
  }
}
