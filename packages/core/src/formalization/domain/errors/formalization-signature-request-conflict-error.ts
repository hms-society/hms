import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export class FormalizationSignatureRequestConflictError extends ConflictError {
  constructor(message = 'A operação de assinatura não está disponível.') {
    super(message)
    this.title = 'Assinatura indisponível'
  }
}
