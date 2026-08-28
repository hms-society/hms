import { BadRequestError } from '#shared/domain/errors'

export class FormalizationSignatureChannelUnavailableError extends BadRequestError {
  constructor(message = 'O canal selecionado não está disponível para o signatário.') {
    super(message)
  }
}
