import { ConflictError } from '#shared/domain/errors/conflict-error'

export class ActiveAttendanceAlreadyExistsError extends ConflictError {
  constructor() {
    super('O cliente já possui outro atendimento ativo.')
  }
}
