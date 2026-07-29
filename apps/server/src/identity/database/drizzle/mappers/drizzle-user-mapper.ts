import type { User } from '@hms/core/identity/domain/entities'

import type { DrizzleUser } from '@/identity/database/drizzle/types/entities'

export class DrizzleUserMapper {
  toDomain(drizzleUser: DrizzleUser): User {
    return {
      id: drizzleUser.id,
      email: drizzleUser.email,
      status: drizzleUser.status,
      createdAt: drizzleUser.createdAt,
      updatedAt: drizzleUser.updatedAt,
    }
  }
}
