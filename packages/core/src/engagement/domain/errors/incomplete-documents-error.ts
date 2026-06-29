import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class IncompleteDocumentsError extends ConflictError {
  constructor() {
    super('Todos os documentos contratuais devem estar assinados.')
  }
}
