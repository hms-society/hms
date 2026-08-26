import { BadRequestError } from '../../../shared/domain/errors/bad-request-error'

export class FormalizationContractFormReplacementError extends BadRequestError {
  constructor(
    message = 'A ficha selecionada não está disponível para esta formalização.',
  ) {
    super(message)
  }
}
