import { ForbiddenError } from '#shared/domain/errors/forbidden-error'

export class ConsultationDocumentAccessDeniedError extends ForbiddenError {
  constructor() {
    super('Somente o advogado associado pode operar os documentos desta consulta.')
  }
}
