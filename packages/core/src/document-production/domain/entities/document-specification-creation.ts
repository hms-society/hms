import type { DocumentSpecification } from './document-specification'

export type DocumentSpecificationCreation = Omit<
  DocumentSpecification,
  'id' | 'createdAt' | 'updatedAt'
>
