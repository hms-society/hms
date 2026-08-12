import { NotFoundError } from '#shared/domain/errors/not-found-error'

export class ConsultationDocumentNotFoundError extends NotFoundError {
  constructor() {
    super('O documento não pertence à consulta informada.')
  }
}
