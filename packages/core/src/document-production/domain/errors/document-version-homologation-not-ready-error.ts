import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentVersionHomologationNotReadyError extends ConflictError {
  constructor() {
    super('A versão documental precisa estar aprovada e sem pendências para homologação.')
  }
}
