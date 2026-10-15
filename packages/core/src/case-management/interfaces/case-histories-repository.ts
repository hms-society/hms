import type {
  CaseHistoryEntry,
  CaseHistoryRecord,
  CaseHistoryRecordCreation,
} from '../domain/entities'
import type { CaseHistoryCategory, CaseHistoryCursor } from '../domain/structures'
export interface CaseHistoriesRepository {
  listByCaseId(query: {
    caseId: string
    category?: CaseHistoryCategory
    search?: string
    before?: CaseHistoryCursor
    limit: number
  }): Promise<readonly CaseHistoryEntry[]>
  findManualOperation(
    caseId: string,
    actorId: string,
    operationId: string,
  ): Promise<CaseHistoryRecord | undefined>
  findById(caseId: string, entryId: string): Promise<CaseHistoryEntry | undefined>
  add(record: CaseHistoryRecordCreation): Promise<CaseHistoryRecord>
}
