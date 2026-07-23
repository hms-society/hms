import { ConflictError } from '#shared/domain/errors/conflict-error'

export class AttendanceAssignedToAnotherAttendantError extends ConflictError {
  constructor() {
    super('O atendimento está atribuído a outro atendente.')
  }
}
