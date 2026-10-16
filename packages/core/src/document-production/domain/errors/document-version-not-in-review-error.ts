import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentVersionNotInReviewError extends ConflictError {
  constructor() {
    super('A versão documental precisa ser submetida para revisão antes da decisão.')
  }
}
