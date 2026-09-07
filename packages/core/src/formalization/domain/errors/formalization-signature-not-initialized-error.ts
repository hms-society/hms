import { ConflictError } from '#shared/domain/errors'

export class FormalizationSignatureNotInitializedError extends ConflictError {
  constructor(message = 'A configuração de assinatura ainda não foi inicializada.') {
    super(message)
  }
}
