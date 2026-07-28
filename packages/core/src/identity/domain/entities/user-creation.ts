import type { User } from './user'

export type UserCreation = Omit<User, 'createdAt' | 'updatedAt'>
