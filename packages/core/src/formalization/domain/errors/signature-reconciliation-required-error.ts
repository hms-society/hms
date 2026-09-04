import { AppError } from '../../../shared/domain/errors/app-error'

export class SignatureReconciliationRequiredError extends AppError {
  constructor(message = 'A operação de assinatura não está disponível.') {
    super(message, 'Assinatura indisponível')
  }
}
