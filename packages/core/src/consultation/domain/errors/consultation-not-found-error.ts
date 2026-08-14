import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ConsultationNotFoundError extends NotFoundError {
  constructor() {
    super('Consulta não encontrada.')
  }
}
