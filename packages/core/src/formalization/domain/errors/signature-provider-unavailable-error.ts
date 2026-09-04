import { AppError } from '../../../shared/domain/errors/app-error'

export class SignatureProviderUnavailableError extends AppError {
  constructor(message = 'A operação de assinatura não está disponível.') {
    super(message, 'Assinatura indisponível')
  }
}
