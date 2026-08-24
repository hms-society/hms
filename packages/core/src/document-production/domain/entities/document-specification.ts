import type {
  DocumentSpecificationApplication,
  DocumentSpecificationStatus,
  DocumentTemplateContent,
  DocumentTemplateVariable,
} from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentSpecification = Entity & {
  name: string
  description: string
  application: DocumentSpecificationApplication
  content: DocumentTemplateContent
  variables: DocumentTemplateVariable[]
  status: DocumentSpecificationStatus
  createdAt: Date
  updatedAt: Date
}
