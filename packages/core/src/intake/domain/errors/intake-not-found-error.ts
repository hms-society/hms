import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class IntakeNotFoundError extends NotFoundError {
  constructor() {
    super('Intake não encontrado.')
  }
}
