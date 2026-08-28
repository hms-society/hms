import { BadRequestError } from '#shared/domain/errors'

export class FormalizationSignatoryIneligibleError extends BadRequestError {
  constructor(message = 'A pessoa selecionada não pode ser signatária.') {
    super(message)
  }
}
