export type ChecklistDocumentAction =
  | {
      kind: 'existing'
      documentId: string
      operationId: string
      expectedUpdatedAt: string
    }
  | { kind: 'upload'; uploadId: string; operationId: string; expectedUpdatedAt: string }
