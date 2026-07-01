import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class AlreadyFormalizedError extends ConflictError {
  constructor() {
    super('A formalização já foi concluída.')
  }
}
