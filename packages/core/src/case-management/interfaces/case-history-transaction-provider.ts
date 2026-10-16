export interface CaseHistoryTransactionProvider {
  runInTransaction<T>(callback: () => Promise<T>): Promise<T>
}
