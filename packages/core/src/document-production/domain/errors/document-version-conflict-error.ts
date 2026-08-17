import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentVersionConflictError extends ConflictError {
  constructor() {
    super('A versão documental já foi revisada.')
  }
}
