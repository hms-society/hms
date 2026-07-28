import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/database.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import {
  DrizzleClientConsentMapper,
  DrizzleClientMapper,
  DrizzleUserMapper,
} from '@/identity/database/drizzle/mappers'
import {
  DrizzleClientConsentsRepository,
  DrizzleClientsRepository,
  DrizzleUsersRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentitySeeder } from '@/identity/database/identity-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleClientMapper,
    DrizzleClientConsentMapper,
    DrizzleUserMapper,
    DrizzleClientsRepository,
    DrizzleClientConsentsRepository,
    DrizzleUsersRepository,
    {
      provide: IDENTITY_REPOSITORIES.clients,
      useExisting: DrizzleClientsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.clientConsents,
      useExisting: DrizzleClientConsentsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.users,
      useExisting: DrizzleUsersRepository,
    },
    IdentitySeeder,
  ],
  exports: [
    IDENTITY_REPOSITORIES.clients,
    IDENTITY_REPOSITORIES.clientConsents,
    IDENTITY_REPOSITORIES.users,
    IdentitySeeder,
  ],
})
export class IdentityDatabaseModule {}
