import type { Entity } from '../../../shared/domain/entities/entity'

export type DocumentTemplate = Entity & {
  name: string
  fileId: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}
