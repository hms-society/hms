import { NotFoundError } from '#shared/domain/errors/not-found-error.ts'

export class IntakeNotFoundError extends NotFoundError {
  constructor() {
    super('Atendimento não encontrado.')
  }
}
