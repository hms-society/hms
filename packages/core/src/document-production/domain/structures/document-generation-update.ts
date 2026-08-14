import type { DocumentGenerationStatus } from './document-generation-status'
import type { DocumentGenerationFinding } from './document-generation-finding'

export type DocumentGenerationUpdate = {
  readonly status: DocumentGenerationStatus
  readonly attemptsCount: number
  readonly findings?: readonly DocumentGenerationFinding[]
  readonly documentVersionId?: string
  readonly failureMessage?: string
  readonly startedAt?: Date
  readonly completedAt?: Date
  readonly failedAt?: Date
  readonly cancelledAt?: Date
  readonly updatedAt: Date
}
