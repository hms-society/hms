import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export class FormalizationDocumentStaleError extends ConflictError {
  constructor() {
    super('Os documentos precisam de uma versão derivada das condições comerciais atuais.')
  }
}
