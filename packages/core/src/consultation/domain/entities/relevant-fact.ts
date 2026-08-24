import type { Entity } from '../../../shared/domain/entities/entity'

export type RelevantFact = Entity & {
  description: string
  occurredOn?: Date
}
