import { Module } from '@nestjs/common'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { DrizzleUserMapper } from '@/identity/database/drizzle/mappers'
import { DrizzleUsersRepository } from '@/identity/database/drizzle/repositories'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleUserMapper,
    DrizzleUsersRepository,
    {
      provide: IDENTITY_REPOSITORIES.users,
      useExisting: DrizzleUsersRepository,
    },
  ],
  exports: [IDENTITY_REPOSITORIES.users, DrizzleUsersRepository],
})
export class IdentityUsersDatabaseModule {}
