import type { Entity } from '../../../shared/domain/entities/entity'

export type Document = Entity & {
  title: string
  currentVersionId?: string
  createdAt: Date
  updatedAt: Date
}
