import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentGenerationConflictError extends ConflictError {
  constructor(message = 'A geração documental foi alterada por outra operação.') {
    super(message)
  }
}
