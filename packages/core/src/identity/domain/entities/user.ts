import type { UserStatus } from '../structures'

export type User = {
  id: string
  email: string
  status: UserStatus
  createdAt: Date
  updatedAt: Date
}
