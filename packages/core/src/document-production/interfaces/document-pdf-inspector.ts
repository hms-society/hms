import type { DocumentPdfInspection } from '../domain/structures'

export interface DocumentPdfInspector {
  inspect(content: Uint8Array): Promise<DocumentPdfInspection>
}
