import type { DocumentPdfInspection } from '../../document-production/domain/structures'

export interface FormalizationDocumentPdfInspector {
  inspect(content: Uint8Array): Promise<DocumentPdfInspection>
}
