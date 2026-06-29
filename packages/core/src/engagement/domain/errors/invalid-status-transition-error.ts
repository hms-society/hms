import { ConflictError } from '#shared/domain/errors/conflict-error.ts'

export class InvalidStatusTransitionError extends ConflictError {
  constructor() {
    super('Transição de status inválida para o atendimento.')
  }
}
