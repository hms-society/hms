import type { DocumentSpecification } from '../entities/document-specification'

export type DocumentSpecificationDetails = Omit<
  DocumentSpecification,
  'id' | 'createdAt' | 'updatedAt'
> & {
  readonly documentSpecificationId: string
  readonly updatedAt: string
}
