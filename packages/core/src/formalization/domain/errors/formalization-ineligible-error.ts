import { BadRequestError } from '../../../shared/domain/errors/bad-request-error'

export class FormalizationIneligibleError extends BadRequestError {
  constructor(message = 'O Intake não está apto para iniciar uma formalização.') {
    super(message)
  }
}
