import { ConflictError } from '#shared/domain/errors/conflict-error'

export class DocumentPackageCannotBeConfirmedError extends ConflictError {
  constructor() {
    super('Todos os documentos do pacote devem estar aprovados antes da confirmação.')
  }
}
