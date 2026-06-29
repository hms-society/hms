import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ConsultationAlreadyHeldError extends ConflictError {
  constructor() {
    super('A consulta já foi realizada.')
  }
}
