import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentVersionPendingMarkersError extends ConflictError {
  constructor() {
    super('Resolva as pendências do documento antes de aprovar esta versão.')
  }
}
