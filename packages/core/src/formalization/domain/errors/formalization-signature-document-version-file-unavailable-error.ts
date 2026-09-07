import { NotFoundError } from '#shared/domain/errors'

export class FormalizationSignatureDocumentVersionFileUnavailableError extends NotFoundError {
  constructor(message = 'O arquivo da versão do documento não está disponível.') {
    super(message)
  }
}
