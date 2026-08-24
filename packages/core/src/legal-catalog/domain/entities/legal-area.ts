import type { Entity } from '../../../shared/domain/entities/entity'

export type LegalArea = Entity & {
  name: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}
