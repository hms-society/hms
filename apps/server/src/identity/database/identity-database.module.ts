import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IdentityCollaboratorsDatabaseModule } from '@/identity/database/identity-collaborators-database.module'
import { IdentityUsersDatabaseModule } from '@/identity/database/identity-users-database.module'
import {
  DrizzleClientConsentMapper,
  DrizzleClientMapper,
  DrizzleCollaboratorRegistrationAttemptMapper,
} from '@/identity/database/drizzle/mappers'
import {
  DrizzleClientConsentsRepository,
  DrizzleClientsRepository,
  DrizzleCollaboratorRegistrationAttemptsRepository,
  DrizzleIdentityTransaction,
} from '@/identity/database/drizzle/repositories'
import {
  DrizzleIntakeClientsRepository,
  DrizzleIntakeResponsiblesRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'

@Module({
  imports: [
    SharedDatabaseModule,
    IdentityUsersDatabaseModule,
    IdentityCollaboratorsDatabaseModule,
    LegalCatalogModule,
  ],
  providers: [
    DrizzleClientMapper,
    DrizzleClientConsentMapper,
    DrizzleCollaboratorRegistrationAttemptMapper,
    DrizzleClientsRepository,
    DrizzleClientConsentsRepository,
    DrizzleCollaboratorRegistrationAttemptsRepository,
    DrizzleIdentityTransaction,
    DrizzleIntakeClientsRepository,
    DrizzleIntakeResponsiblesRepository,
    {
      provide: IDENTITY_REPOSITORIES.clients,
      useExisting: DrizzleClientsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.clientConsents,
      useExisting: DrizzleClientConsentsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.registrationAttempts,
      useExisting: DrizzleCollaboratorRegistrationAttemptsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.transaction,
      useExisting: DrizzleIdentityTransaction,
    },
    {
      provide: IDENTITY_REPOSITORIES.intakeClients,
      useExisting: DrizzleIntakeClientsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.intakeResponsibles,
      useExisting: DrizzleIntakeResponsiblesRepository,
    },
    IdentitySeeder,
  ],
  exports: [
    IdentityUsersDatabaseModule,
    IdentityCollaboratorsDatabaseModule,
    IDENTITY_REPOSITORIES.clients,
    IDENTITY_REPOSITORIES.clientConsents,
    IDENTITY_REPOSITORIES.registrationAttempts,
    IDENTITY_REPOSITORIES.transaction,
    IDENTITY_REPOSITORIES.intakeClients,
    IDENTITY_REPOSITORIES.intakeResponsibles,
    IdentitySeeder,
  ],
})
export class IdentityDatabaseModule {}
