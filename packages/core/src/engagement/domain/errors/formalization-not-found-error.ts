import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class FormalizationNotFoundError extends NotFoundError {
  constructor() {
    super('Formalização não encontrada.')
  }
}
