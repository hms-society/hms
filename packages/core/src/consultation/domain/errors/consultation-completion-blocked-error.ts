import { BadRequestError } from '#shared/domain/errors/bad-request-error'

export class ConsultationCompletionBlockedError extends BadRequestError {
  constructor(message = 'Finalize a ficha e confirme o pacote de documentos antes de concluir a consulta.') {
    super(message)
  }
}
