import type { DocumentException } from '../domain/entities/document-exception'

export type CreateDocumentExceptionData = {
  documentId?: string | null
  caseId: string
  type: string
  status: string
  justification: string
  deadlineDate?: Date | null
  createdBy: string
}

export type UpdateDocumentExceptionStatusData = {
  status: string
  reviewedBy: string
}

export interface DocumentExceptionsRepository {
  create(data: CreateDocumentExceptionData): Promise<DocumentException>
  findById(id: string): Promise<DocumentException | null>
  findByCaseId(caseId: string): Promise<DocumentException[]>
  updateStatus(id: string, data: UpdateDocumentExceptionStatusData): Promise<DocumentException>
  hasExpiredExceptionsForCase(caseId: string): Promise<boolean>
  findExpiredProvisionalAcceptances(): Promise<DocumentException[]>
}
