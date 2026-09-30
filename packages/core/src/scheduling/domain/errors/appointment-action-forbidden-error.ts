import { ForbiddenError } from '#shared/domain/errors/forbidden-error'

export class AppointmentActionForbiddenError extends ForbiddenError {
  constructor() {
    super('Você não tem permissão para operar este agendamento.')
  }
}
