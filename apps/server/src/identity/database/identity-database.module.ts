import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/database.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import {
  DrizzleClientConsentMapper,
  DrizzleClientMapper,
} from '@/identity/database/drizzle/mappers'
import {
  DrizzleClientConsentsRepository,
  DrizzleClientsRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentitySeeder } from '@/identity/database/identity-seeder'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleClientMapper,
    DrizzleClientConsentMapper,
    DrizzleClientsRepository,
    DrizzleClientConsentsRepository,
    {
      provide: IDENTITY_REPOSITORIES.clients,
      useExisting: DrizzleClientsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.clientConsents,
      useExisting: DrizzleClientConsentsRepository,
    },
    IdentitySeeder,
  ],
  exports: [
    IDENTITY_REPOSITORIES.clients,
    IDENTITY_REPOSITORIES.clientConsents,
    IdentitySeeder,
  ],
})
export class IdentityDatabaseModule {}
