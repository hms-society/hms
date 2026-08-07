import type {
  DocumentSpecificationApplication,
  DocumentSpecificationStatus,
  DocumentTemplateVariable,
} from '../structures'

export type DocumentSpecification = {
  id: string
  name: string
  description: string
  application: DocumentSpecificationApplication
  isRequired: boolean
  content: string
  variables: readonly DocumentTemplateVariable[]
  status: DocumentSpecificationStatus
  createdAt: Date
  updatedAt: Date
}
