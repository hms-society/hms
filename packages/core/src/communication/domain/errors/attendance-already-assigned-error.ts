import { ConflictError } from '#shared/domain/errors/conflict-error'

export class AttendanceAlreadyAssignedError extends ConflictError {
  constructor() {
    super('O atendimento já foi assumido por outro atendente.')
  }
}
