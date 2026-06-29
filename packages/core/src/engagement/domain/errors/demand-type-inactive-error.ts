import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class DemandTypeInactiveError extends ConflictError {
  constructor() {
    super('O tipo de demanda informado está inativo.')
  }
}
