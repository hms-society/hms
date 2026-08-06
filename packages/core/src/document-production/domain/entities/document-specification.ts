import type {
  DocumentSpecificationApplication,
  DocumentSpecificationStatus,
  DocumentTemplateContent,
  DocumentTemplateVariable,
} from '../structures'

export type DocumentSpecification = {
  id: string
  name: string
  description: string
  application: DocumentSpecificationApplication
  isRequired: boolean
  content: DocumentTemplateContent
  variables: readonly DocumentTemplateVariable[]
  status: DocumentSpecificationStatus
  createdAt: Date
  updatedAt: Date
}
