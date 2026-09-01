import type { DocumentSpecificationApplication } from './document-specification-application'
import type { DocumentSpecificationStatus } from './document-specification-status'

export type DocumentSpecificationListRecord = {
  readonly documentSpecificationId: string
  readonly name: string
  readonly description: string
  readonly application: DocumentSpecificationApplication
  readonly status: DocumentSpecificationStatus
}
