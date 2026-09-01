import type {
  FormalizationDocumentPdfConversion,
  FormalizationDocumentPdfConversionResult,
} from '../domain/structures'

export interface DocumentPdfConverter {
  convert(
    input: FormalizationDocumentPdfConversion,
  ): Promise<FormalizationDocumentPdfConversionResult>
}
