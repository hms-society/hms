import { AppError } from '../../../shared/domain/errors/app-error'

export class DocumentPdfConversionError extends AppError {
  readonly retryable: boolean

  constructor(message = 'Não foi possível converter o documento para PDF.', retryable = true) {
    super(message, 'Erro de conversão do documento')
    this.retryable = retryable
  }
}
