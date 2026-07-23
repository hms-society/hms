import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class AttendanceNotFoundError extends NotFoundError {
  constructor() {
    super('Atendimento não encontrado.')
  }
}
