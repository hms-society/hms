import type { UserStatus } from '../structures'

export type User = {
  readonly id: string
  readonly email: string
  readonly status: UserStatus
  readonly lastAccessAt?: Date
  readonly createdAt: Date
  readonly updatedAt: Date
}
