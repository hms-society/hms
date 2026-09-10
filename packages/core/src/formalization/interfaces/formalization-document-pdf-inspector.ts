import type { FormalizationDocumentPdfInspection } from '../domain/structures'

export interface FormalizationDocumentPdfInspector {
  inspect(content: Uint8Array): Promise<FormalizationDocumentPdfInspection>
}
