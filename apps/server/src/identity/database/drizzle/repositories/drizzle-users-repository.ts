import { Inject, Injectable, Optional } from '@nestjs/common'
import type { User, UserCreation } from '@hms/core/identity/domain/entities'
import type { UsersRepository } from '@hms/core/identity/interfaces'
import { eq, sql } from 'drizzle-orm'

import { DrizzleUserMapper } from '@/identity/database/drizzle/mappers'
import { userModel } from '@/identity/database/drizzle/models'
import {
  DrizzleIdentityRepository,
  type IdentityDatabaseExecutor,
} from '@/identity/database/drizzle/repositories/drizzle-identity-repository'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'

@Injectable()
export class DrizzleUsersRepository
  extends DrizzleIdentityRepository
  implements UsersRepository
{
  constructor(
    @Inject(DrizzleClient)
    drizzle: DrizzleClient,
    @Inject(DrizzleUserMapper) private readonly userMapper: DrizzleUserMapper,
    @Optional()
    databaseOverride?: IdentityDatabaseExecutor,
  ) {
    super(drizzle, databaseOverride)
  }

  async addMany(users: UserCreation[]): Promise<User[]> {
    if (users.length === 0) return []

    const createdUsers = await this.database.insert(userModel).values(users).returning()

    return createdUsers.map((user) => this.userMapper.toDomain(user))
  }

  async removeAll(): Promise<void> {
    await this.database.delete(userModel)
  }

  async removeById(userId: string): Promise<void> {
    await this.database.delete(userModel).where(eq(userModel.id, userId))
  }

  async findById(userId: string): Promise<User | undefined> {
    const [user] = await this.database
      .select()
      .from(userModel)
      .where(eq(userModel.id, userId))
      .limit(1)

    return user ? this.userMapper.toDomain(user) : undefined
  }

  async findByEmail(email: string): Promise<User | undefined> {
    const [user] = await this.database
      .select()
      .from(userModel)
      .where(sql`lower(btrim(${userModel.email})) = lower(btrim(${email}))`)
      .limit(1)

    return user ? this.userMapper.toDomain(user) : undefined
  }

  async updateStatus(userId: string, status: User['status']): Promise<User | undefined> {
    const [user] = await this.database
      .update(userModel)
      .set({ status, updatedAt: new Date() })
      .where(eq(userModel.id, userId))
      .returning()

    return user ? this.userMapper.toDomain(user) : undefined
  }

  async updateLastAccessAt(
    userId: string,
    lastAccessAt: Date,
  ): Promise<User | undefined> {
    const [user] = await this.database
      .update(userModel)
      .set({ lastAccessAt, updatedAt: new Date() })
      .where(eq(userModel.id, userId))
      .returning()

    return user ? this.userMapper.toDomain(user) : undefined
  }

  withDatabase(database: IdentityDatabaseExecutor) {
    return new DrizzleUsersRepository(this.drizzleClient, this.userMapper, database)
  }
}
