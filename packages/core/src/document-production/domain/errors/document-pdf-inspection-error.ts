import { AppError } from '../../../shared/domain/errors/app-error'

export class DocumentPdfInspectionError extends AppError {
  constructor(message = 'O PDF produzido não pôde ser validado.') {
    super(message, 'Erro de inspeção do PDF')
  }
}
