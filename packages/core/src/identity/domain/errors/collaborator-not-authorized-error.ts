import { ForbiddenError } from '#shared/domain/errors'

export class CollaboratorNotAuthorizedError extends ForbiddenError {
  constructor(message?: string) {
    super(message || 'O colaborador autenticado não tem autorização para esta operação.')
  }
}
