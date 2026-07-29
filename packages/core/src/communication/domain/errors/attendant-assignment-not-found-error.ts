import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class AttendantAssignmentNotFoundError extends NotFoundError {
  constructor() {
    super('Atribuição de atendente não encontrada.')
  }
}
