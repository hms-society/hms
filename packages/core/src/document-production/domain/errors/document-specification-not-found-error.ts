import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class DocumentSpecificationNotFoundError extends NotFoundError {
  constructor(documentSpecificationId: string) {
    super(`Modelo de documento ${documentSpecificationId} não encontrado.`)
  }
}
