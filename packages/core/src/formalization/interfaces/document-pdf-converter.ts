import type {
  DocumentPdfConversion,
  DocumentPdfConversionResult,
} from '../../document-production/domain/structures'

export interface DocumentPdfConverter {
  convert(input: DocumentPdfConversion): Promise<DocumentPdfConversionResult>
}
