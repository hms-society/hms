import type { User, UserCreation } from '../domain/entities'

export interface UsersRepository {
  addMany(users: UserCreation[]): Promise<User[]>
  removeAll(): Promise<void>
  removeById(userId: string): Promise<void>
  findById(userId: string): Promise<User | undefined>
  findByEmail(email: string): Promise<User | undefined>
  updateStatus(userId: string, status: User['status']): Promise<User | undefined>
  updateLastAccessAt(userId: string, lastAccessAt: Date): Promise<User | undefined>
}
