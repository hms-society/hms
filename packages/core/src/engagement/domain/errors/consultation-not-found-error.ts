import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class ConsultationNotFoundError extends NotFoundError {
  constructor() {
    super('Consulta não encontrada.')
  }
}
