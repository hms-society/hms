import { ConflictError } from '../../../shared/domain/errors/conflict-error'

export type DocumentVersionNotFreezableReason =
  | 'not_found'
  | 'stale'
  | 'unapproved'
  | 'source_missing'

export class DocumentVersionNotFreezableError extends ConflictError {
  readonly reason: DocumentVersionNotFreezableReason

  constructor(reason: DocumentVersionNotFreezableReason) {
    super('A versão do documento não está disponível para congelamento.')
    this.reason = reason
  }
}
