import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class ContractualDocumentTypeNotFoundError extends NotFoundError {
  constructor() {
    super('Tipo de documento contratual não encontrado.')
  }
}
