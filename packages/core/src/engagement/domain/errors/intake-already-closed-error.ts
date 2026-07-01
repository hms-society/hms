import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class IntakeAlreadyClosedError extends ConflictError {
  constructor() {
    super('O atendimento já está em status terminal.')
  }
}
