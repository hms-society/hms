import type { DocumentPackageTemplateItem } from './document-package-template-item'

export type DocumentPackageTemplate = {
  id: string
  legalAreaId: string
  legalTopicIds: [string, ...string[]]
  items: DocumentPackageTemplateItem[]
  active: boolean
  createdAt: Date
  updatedAt: Date
}
