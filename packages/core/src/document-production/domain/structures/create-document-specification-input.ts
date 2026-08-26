import type { DocumentSpecification } from '../entities/document-specification'

export type CreateDocumentSpecificationInput = Pick<
  DocumentSpecification,
  'name' | 'description' | 'application'
> &
  Partial<Pick<DocumentSpecification, 'content' | 'variables' | 'status'>>
