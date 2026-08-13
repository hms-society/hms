import type { DocumentFileExport, DocumentTemplateContent } from '../domain/structures'

export interface DocumentFileExporter {
  export(input: {
    readonly title: string
    readonly content: DocumentTemplateContent
  }): Promise<DocumentFileExport>
}
