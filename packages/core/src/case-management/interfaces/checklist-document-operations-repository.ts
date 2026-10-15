import type { ChecklistDocumentOperation } from '../domain/entities/checklist-document-operation'
export interface ChecklistDocumentOperationsRepository {
  find(request: {
    caseId: string
    actorId: string
    operationId: string
  }): Promise<ChecklistDocumentOperation | undefined>
  add(request: Omit<ChecklistDocumentOperation, 'id'>): Promise<void>
}
