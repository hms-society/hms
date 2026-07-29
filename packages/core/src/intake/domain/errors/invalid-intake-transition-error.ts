import type { IntakeStatus } from '../structures'
import { ConflictError } from '#shared/domain/errors/conflict-error'

export class InvalidIntakeTransitionError extends ConflictError {
  constructor(from: IntakeStatus, to: IntakeStatus) {
    super(`A transição de ${from} para ${to} não é permitida.`)
  }
}
