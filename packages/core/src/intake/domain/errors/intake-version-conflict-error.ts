import { ConflictError } from '#shared/domain/errors/conflict-error'

export class IntakeVersionConflictError extends ConflictError {
  constructor() {
    super(
      'O Intake foi alterado por outro usuário. Recarregue os dados e tente novamente.',
    )
  }
}
