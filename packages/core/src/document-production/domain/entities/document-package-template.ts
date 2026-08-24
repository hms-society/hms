import type { DocumentPackageTemplateItem } from './document-package-template-item'
import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentPackageTemplate = Entity & {
  legalAreaId: string
  legalTopicIds: [string, ...string[]]
  items: DocumentPackageTemplateItem[]
  active: boolean
  createdAt: Date
  updatedAt: Date
}
