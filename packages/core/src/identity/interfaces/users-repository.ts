import type { User, UserCreation } from '../domain/entities'

export interface UsersRepository {
  addMany(users: UserCreation[]): Promise<User[]>
  removeAll(): Promise<void>
}
