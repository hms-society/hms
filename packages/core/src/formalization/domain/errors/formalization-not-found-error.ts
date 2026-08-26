import { NotFoundError } from '../../../shared/domain/errors/not-found-error'

export class FormalizationNotFoundError extends NotFoundError {
  constructor() {
    super('Formalização não encontrada.')
  }
}
