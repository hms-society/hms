import { BadRequestError } from '#shared/domain/errors'

export class FormalizationDefaultSignatoryRemovalError extends BadRequestError {
  constructor(message = 'Os signatários padrão não podem ser removidos.') {
    super(message)
  }
}
