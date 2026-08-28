import type { DocumentSpecificationApplication } from '../structures/document-specification-application'
import type { DocumentSpecificationStatus } from '../structures/document-specification-status'
import type { DocumentTemplateContent } from '../structures/document-template-content'
import type { DocumentTemplateVariable } from '../structures/document-template-variable'
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
