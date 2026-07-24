import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class AppointmentNotFoundError extends NotFoundError {
  constructor() {
    super('Agendamento não encontrado.')
  }
}
