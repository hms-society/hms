import { ConflictError } from '#shared/domain/errors/conflict-error'

export class AppointmentConflictError extends ConflictError {
  constructor() {
    super('O período selecionado não está disponível.')
  }
}
