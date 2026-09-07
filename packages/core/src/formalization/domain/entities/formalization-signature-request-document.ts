import type { Entity } from '#shared/domain/entities/entity'
import type { FormalizationSignatureRequestDocumentStatus } from '../structures/formalization-signature-request-document-status'

export type FormalizationSignatureRequestDocument = Entity & {
  requestId: string
  sourceDocumentId: string
  sourceDocumentVersionId: string
  signaturePreviewId: string
  unsignedPrivateFileId: string
  unsignedSha256: string
  byteCount: number
  pageCount: number
  position: number
  status: FormalizationSignatureRequestDocumentStatus
  version: number
  provisionedAt?: Date
  submittedAt?: Date
  confirmedAt?: Date
  terminalAt?: Date
  createdAt: Date
  updatedAt: Date
}
