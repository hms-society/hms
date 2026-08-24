import type { Entity } from '../../../shared/domain/entities/entity'

export type IdentifiedRisk = Entity & {
  description: string
}
