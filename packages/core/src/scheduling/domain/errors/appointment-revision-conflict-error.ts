import { ConflictError } from '#shared/domain/errors/conflict-error'

export class AppointmentRevisionConflictError extends ConflictError {
  constructor() {
    super('O agendamento foi alterado. Recarregue os dados antes de tentar novamente.')
  }
}
