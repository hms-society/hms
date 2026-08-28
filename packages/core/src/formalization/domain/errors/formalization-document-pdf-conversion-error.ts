import { AppError } from '#shared/domain/errors'

export class FormalizationDocumentPdfConversionError extends AppError {
  constructor(
    message = 'Não foi possível converter o documento da formalização para PDF.',
    public readonly retryable = true,
  ) {
    super(message, 'Erro na Conversão do PDF')
  }
}
