import { ConflictError } from '#shared/domain/errors/conflict-error'

export class CollaboratorAuthUserAlreadyConfirmedError extends ConflictError {
  constructor() {
    super(
      'Este colaborador já confirmou o acesso no Auth. Ele deve entrar pela tela de login para ativar o cadastro local.',
    )
  }
}
