import { ConflictError } from '#shared/domain/errors/conflict-error'

export class InvalidIntakeClosureError extends ConflictError {
  constructor(message = 'Os dados do encerramento do Intake são inválidos.') {
    super(message)
  }
}
