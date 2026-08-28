import type { Entity } from '#shared/domain/entities'
import type { CommunicationChannel } from '../../../communication/domain/structures'
import type { FormalizationSignatoryRole } from '../structures'

export type FormalizationSignatory = Entity & {
  formalizationId: string
  role: FormalizationSignatoryRole
  personId: string
  position: number
  selectedChannels: readonly CommunicationChannel[]
  createdByCollaboratorId: string
  createdAt: Date
  updatedByCollaboratorId: string
  updatedAt: Date
}
