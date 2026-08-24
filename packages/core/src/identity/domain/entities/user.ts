import type { UserStatus } from '../structures'
import type { Entity } from '../../../shared/domain/entities/entity'

export type User = Entity & {
  email: string
  status: UserStatus
  lastAccessAt?: Date
  createdAt: Date
  updatedAt: Date
}
