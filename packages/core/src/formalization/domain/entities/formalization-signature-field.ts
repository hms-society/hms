import type { Entity } from '#shared/domain/entities'
import type { FormalizationSignatureFieldType } from '../structures'

export type FormalizationSignatureField = Entity & {
  formalizationId: string
  signatoryDocumentId: string
  previewId: string
  type: typeof FormalizationSignatureFieldType.Signature
  page: number
  positionX: number
  positionY: number
  width: number
  height: number
  createdByCollaboratorId: string
  createdAt: Date
  updatedByCollaboratorId: string
  updatedAt: Date
}
