import { ConflictError } from '#shared/domain/errors/conflict-error'

export class AppointmentRetryConflictError extends ConflictError {
  constructor() {
    super('A nova tentativa não corresponde ao compromisso já reservado.')
  }
}
