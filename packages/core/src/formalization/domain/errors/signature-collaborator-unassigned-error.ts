import { ForbiddenError } from '../../../shared/domain/errors/forbidden-error'

export class SignatureCollaboratorUnassignedError extends ForbiddenError {
  constructor(message = 'Entre com a conta do colaborador atribuído a esta assinatura.') {
    super(message)
  }
}
