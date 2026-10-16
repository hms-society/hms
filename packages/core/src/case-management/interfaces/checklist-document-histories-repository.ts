import type { ChecklistDocumentHistory } from '../domain/entities/checklist-document-history'
type HistoryCreation<T = ChecklistDocumentHistory> = T extends ChecklistDocumentHistory
  ? Omit<T, 'id'>
  : never
export interface ChecklistDocumentHistoriesRepository {
  add(request: HistoryCreation): Promise<void>
}
