import type { Profile } from '../structures/profile'

export type User = {
  id: string
  personId: string
  profile: Profile
  jobTitle?: string
  active: boolean
  createdAt: Date
  updatedAt: Date
}
