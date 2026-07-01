import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class ConsultationNotHeldYetError extends ConflictError {
  constructor() {
    super('A consulta ainda não foi realizada.')
  }
}
