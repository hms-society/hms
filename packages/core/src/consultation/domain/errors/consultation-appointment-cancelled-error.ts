import { ConflictError } from '#shared/domain/errors/conflict-error'

export class ConsultationAppointmentCancelledError extends ConflictError {
  constructor() {
    super('A consulta não pode avançar porque o agendamento foi cancelado.')
  }
}
