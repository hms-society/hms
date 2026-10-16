export interface ClientDocumentReceiptTransactionProvider {
  runInTransaction<T>(operation: () => Promise<T>): Promise<T>
}
