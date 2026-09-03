import { ConflictError } from '#shared/domain/errors'

export class FormalizationSignaturePreviewClaimConflictError extends ConflictError {
  constructor(message = 'A tentativa desta pré-visualização não é mais a atual.') {
    super(message)
  }
}
