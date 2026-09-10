import type { Entity } from '#shared/domain/entities'

export type FormalizationSignatoryDocument = Entity & {
  formalizationId: string
  signatoryId: string
  documentId: string
  documentVersionId: string
  createdByCollaboratorId: string
  createdAt: Date
}
