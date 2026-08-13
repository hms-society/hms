import type { DocumentTemplateContent } from './document-template-content'
import type { DocumentTemplateVariable } from './document-template-variable'

export type DocumentGenerationTemplate = {
  readonly name: string
  readonly content: DocumentTemplateContent
  readonly variables: readonly DocumentTemplateVariable[]
}
