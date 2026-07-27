import { ConflictError } from '#shared/domain/errors/conflict-error'

export class InvalidDocumentBatchStatusError extends ConflictError {
  constructor() {
    super('O lote documental não está em uma situação válida para esta operação.')
  }
}
