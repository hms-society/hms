import { Inject, Injectable } from '@nestjs/common'
import type { User, UserCreation } from '@hms/core/identity/domain/entities'
import type { UsersRepository } from '@hms/core/identity/interfaces'
import { sql } from 'drizzle-orm'

import { DrizzleClient } from '@/shared/database/drizzle-client'
import { DrizzleRepository } from '@/shared/database/drizzle-repository'
import { DrizzleUserMapper } from '@/identity/database/drizzle/mappers'
import { userModel } from '@/identity/database/drizzle/models'

@Injectable()
export class DrizzleUsersRepository extends DrizzleRepository implements UsersRepository {
  constructor(
    drizzle: DrizzleClient,
    @Inject(DrizzleUserMapper) private readonly userMapper: DrizzleUserMapper,
  ) {
    super(drizzle)
  }

  async addMany(users: UserCreation[]): Promise<User[]> {
    if (users.length === 0) return []

    const createdUsers = await this.database
      .insert(userModel)
      .values(users)
      .onConflictDoUpdate({
        target: userModel.email,
        set: {
          id: sql`excluded.id`,
          status: sql`excluded.status`,
          updatedAt: new Date(),
        },
      })
      .returning()

    return createdUsers.map((user) => this.userMapper.toDomain(user))
  }

  async removeAll(): Promise<void> {
    await this.database.delete(userModel)
  }
}
