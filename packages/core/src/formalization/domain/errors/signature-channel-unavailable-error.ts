import { AppError } from '../../../shared/domain/errors/app-error'

export class SignatureChannelUnavailableError extends AppError {
  constructor(message = 'A operação de assinatura não está disponível.') {
    super(message, 'Assinatura indisponível')
  }
}
