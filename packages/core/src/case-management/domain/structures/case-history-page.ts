import type { CaseHistoryEntry } from '../entities/case-history-entry'
export type CaseHistoryPage = { items: readonly CaseHistoryEntry[]; nextCursor?: string }
