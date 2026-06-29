import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class DemandTypeNotFoundError extends NotFoundError {
  constructor() {
    super('Tipo de demanda não encontrado.')
  }
}
