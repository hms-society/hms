import { AppError } from '../../../shared/domain/errors/app-error'

export class SignatureSessionInvalidError extends AppError {
  constructor(message = 'A operação de assinatura não está disponível.') {
    super(message, 'Assinatura indisponível')
  }
}
