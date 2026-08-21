import type { Entity } from '../../../shared/domain/entities/entity'

export type LegalTopic = Entity & {
  legalAreaId: string
  name: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}
