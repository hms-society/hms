import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentVersionNotApprovedError extends ConflictError {
  constructor() {
    super('Somente uma versão aprovada pode ser selecionada como vigente.')
  }
}
