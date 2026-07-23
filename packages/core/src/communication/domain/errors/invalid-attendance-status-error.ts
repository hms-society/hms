import { ConflictError } from '#shared/domain/errors/conflict-error'

export class InvalidAttendanceStatusError extends ConflictError {
  constructor() {
    super('O atendimento não está em uma situação válida para esta operação.')
  }
}
