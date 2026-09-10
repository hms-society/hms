import { BadRequestError } from '#shared/domain/errors'

export class FormalizationSignatureFieldError extends BadRequestError {
  constructor(message = 'O campo de assinatura possui uma geometria inválida.') {
    super(message)
  }
}
