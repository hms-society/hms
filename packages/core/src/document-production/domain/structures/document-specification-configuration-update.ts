import type { DocumentSpecification } from '../entities/document-specification'

export type DocumentSpecificationConfigurationUpdate = Pick<
  DocumentSpecification,
  'name' | 'description' | 'status' | 'application' | 'isRequired'
>
