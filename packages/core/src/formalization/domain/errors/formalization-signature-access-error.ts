import { ForbiddenError } from '#shared/domain/errors'

export class FormalizationSignatureAccessError extends ForbiddenError {
  constructor(message = 'Você não tem acesso à configuração de assinatura.') {
    super(message)
  }
}
