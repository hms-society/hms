import type { DocumentTemplateContent } from '../../document-production/domain/structures'

export type SaveFormalizationDocumentVersionRequest = {
  readonly sourceDocumentVersionId: string
  readonly content: DocumentTemplateContent
}
