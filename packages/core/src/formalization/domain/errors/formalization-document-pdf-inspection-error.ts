import { AppError } from '#shared/domain/errors'

export class FormalizationDocumentPdfInspectionError extends AppError {
  constructor(message = 'O PDF gerado não pôde ser lido com segurança.') {
    super(message, 'Erro na Leitura do PDF')
  }
}
