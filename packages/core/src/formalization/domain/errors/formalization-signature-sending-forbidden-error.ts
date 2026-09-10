import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'

export class FormalizationSignatureSendingForbiddenError extends ForbiddenError {
  constructor(message = 'A operação de assinatura não está disponível.') {
    super(message)
    this.title = 'Assinatura indisponível'
  }
}
