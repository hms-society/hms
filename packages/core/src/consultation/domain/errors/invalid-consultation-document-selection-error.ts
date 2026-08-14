import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class InvalidConsultationDocumentSelectionError extends BadRequestError {
  constructor() {
    super('Um ou mais modelos não estão disponíveis para esta consulta.')
  }
}
