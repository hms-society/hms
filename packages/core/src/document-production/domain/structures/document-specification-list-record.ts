import type { DocumentSpecificationApplication, DocumentSpecificationStatus } from '.'

export type DocumentSpecificationListRecord = {
  readonly documentSpecificationId: string
  readonly name: string
  readonly description: string
  readonly application: DocumentSpecificationApplication
  readonly status: DocumentSpecificationStatus
}
