import { DocumentExceptionStatus, DocumentExceptionType } from '../structures'

export type DocumentException = {
  id: string
  documentId?: string | null
  caseId: string
  type: DocumentExceptionType
  status: DocumentExceptionStatus
  justification: string
  deadlineDate?: Date | null
  createdBy: string
  reviewedBy?: string | null
  createdAt: Date
  updatedAt: Date
}
