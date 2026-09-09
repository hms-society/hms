import { ConflictError } from '#shared/domain/errors'

export class FormalizationSignaturePreviewNotReadyError extends ConflictError {
  constructor(message = 'A pré-visualização ainda não está pronta para edição.') {
    super(message)
  }
}
