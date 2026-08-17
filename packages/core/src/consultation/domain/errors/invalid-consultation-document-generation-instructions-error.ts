import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class InvalidConsultationDocumentGenerationInstructionsError extends BadRequestError {
  constructor() {
    super('Informe instruções para a nova versão.')
  }
}
