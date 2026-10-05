import { ConflictError } from '#shared/domain/errors/conflict-error'

export class AppointmentNotEditableError extends ConflictError {
  constructor() {
    super('Este agendamento não pode mais ser alterado.')
  }
}
