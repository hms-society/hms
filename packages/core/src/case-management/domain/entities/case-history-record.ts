import type { CaseHistoryEntry } from './case-history-entry'
export type CaseHistoryRecord = CaseHistoryEntry & {
  sourceKey: string
  operationId?: string
  fingerprint?: string
}
