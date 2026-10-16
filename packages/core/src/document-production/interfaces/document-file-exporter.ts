import type { DocumentFileExport, DocumentTemplateContent } from '../domain/structures'

export interface DocumentFileExporter {
  export(input: {
    readonly title: string
    readonly content: DocumentTemplateContent
    readonly approval?: {
      readonly approvedByName: string
      readonly approvedByProfile: string
      readonly approvedAt: Date
    }
  }): Promise<DocumentFileExport>
}
