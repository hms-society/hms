import { AppError } from '#shared/domain/errors/app-error'

export class CollaboratorNotAuthorizedError extends AppError {
  constructor() {
    super(
      'O colaborador autenticado não tem autorização para esta operação.',
      'Acesso não autorizado',
    )
  }
}
