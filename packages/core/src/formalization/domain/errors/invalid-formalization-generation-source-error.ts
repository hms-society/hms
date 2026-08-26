import { BadRequestError } from '../../../shared/domain/errors/bad-request-error'

export class InvalidFormalizationGenerationSourceError extends BadRequestError {
  constructor(message = 'A fonte da geração da formalização é inválida.') {
    super(message)
  }
}
