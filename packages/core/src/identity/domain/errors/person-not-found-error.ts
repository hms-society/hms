import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class PersonNotFoundError extends NotFoundError {
  constructor() {
    super('Pessoa não encontrada.')
  }
}
