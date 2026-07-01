import type { ContractualDocumentStatus } from './contractual-document-status'

export type ContractualDocument = {
  contractualDocumentTypeId: string
  label: string
  status: ContractualDocumentStatus
  documentId?: string
  signedAt?: Date
}
