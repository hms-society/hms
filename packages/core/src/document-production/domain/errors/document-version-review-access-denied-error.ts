import { ForbiddenError } from '#shared/domain/errors/forbidden-error'

export class DocumentVersionReviewAccessDeniedError extends ForbiddenError {
  constructor() {
    super('Somente administradores, supervisores ou membros do caso podem revisar esta versão.')
  }
}
