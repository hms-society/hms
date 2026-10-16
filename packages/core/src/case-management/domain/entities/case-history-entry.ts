import type { Entity } from '#shared/domain/entities/entity'
import type { CaseHistoryKind } from '../structures/case-history-kind'
import type { CaseHistoryCategory } from '../structures/case-history-category'
import type { CaseHistoryDocumentReference } from '../structures/case-history-document-reference'
import type { CaseHistoryTaskSnapshot } from '../structures/case-history-task-snapshot'
export type CaseHistoryEntry = Entity & {
  caseId: string
  kind: CaseHistoryKind
  category: CaseHistoryCategory
  occurredAt: Date
  recordedAt: Date
  actorId?: string
  actorName?: string
  title: string
  description: string
  documents: readonly CaseHistoryDocumentReference[]
  details?: Readonly<Record<string, unknown>>
  taskChange?: {
    readonly before?: CaseHistoryTaskSnapshot
    readonly after: CaseHistoryTaskSnapshot
  }
}
