import type { DocumentPdfConversion, DocumentPdfConversionResult } from '../domain/structures'

export interface DocumentPdfConverter {
  convert(input: DocumentPdfConversion): Promise<DocumentPdfConversionResult>
}
