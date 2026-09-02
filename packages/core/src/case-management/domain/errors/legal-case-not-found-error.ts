import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class LegalCaseNotFoundError extends NotFoundError {
  constructor() {
    super('O caso não foi encontrado.')
  }
}
