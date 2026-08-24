import { ConflictError } from '#shared/domain/errors/conflict-error'

export class InvalidIntakeUpdateError extends ConflictError {
  constructor(message = 'Este Intake não pode ser editado.') {
    super(message)
  }
}
