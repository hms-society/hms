import { ConflictError } from '#shared/domain/errors/conflict-error'

export class CollaboratorInvitationNotPendingError extends ConflictError {
  constructor() {
    super('O colaborador não possui um convite pendente.')
  }
}
