import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentVersionHomologationConflictError extends ConflictError {
  constructor() {
    super('A versão documental já foi homologada.')
  }
}
