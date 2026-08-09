import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class InvalidDocumentSpecificationConfigurationError extends BadRequestError {
  constructor(message = 'A configuração do modelo de documento é inválida.') {
    super(message)
  }
}
