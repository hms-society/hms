import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class InvalidLegalExpertiseError extends BadRequestError {
  constructor() {
    super('A área ou o tema jurídico informado não é válido para o cadastro.')
  }
}
