import type { DocumentSpecification } from '../entities/document-specification'

export type DocumentSpecificationTemplateUpdate = Pick<
  DocumentSpecification,
  'content' | 'variables'
>
