import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class ConsultationDocumentSelectionRemovalError extends BadRequestError {
  constructor() {
    super('Documentos com versões associadas não podem ser removidos do pacote.')
  }
}
