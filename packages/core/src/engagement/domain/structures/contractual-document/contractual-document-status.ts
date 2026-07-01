export const ContractualDocumentStatus = {
  Pending: 'pending',
  Received: 'received',
  Signed: 'signed',
} as const

export type ContractualDocumentStatus =
  (typeof ContractualDocumentStatus)[keyof typeof ContractualDocumentStatus]
