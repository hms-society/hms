import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ContractualDocumentTypeInactiveError extends ConflictError {
  constructor() {
    super('O tipo de documento contratual informado está inativo.')
  }
}
