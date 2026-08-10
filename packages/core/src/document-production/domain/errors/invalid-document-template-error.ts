import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class InvalidDocumentTemplateError extends BadRequestError {
  constructor(message = 'O template do modelo de documento é inválido.') {
    super(message)
  }
}
