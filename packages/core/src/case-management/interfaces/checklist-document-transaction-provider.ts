export interface ChecklistDocumentTransactionProvider {
  runInTransaction<T>(operation: () => Promise<T>): Promise<T>
}
