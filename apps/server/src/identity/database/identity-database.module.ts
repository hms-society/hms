import { Module } from '@nestjs/common'

import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { IdentityUsersDatabaseModule } from '@/identity/database/identity-users-database.module'
import {
  DrizzleClientConsentMapper,
  DrizzleClientMapper,
  DrizzleCollaboratorMapper,
  DrizzleCollaboratorRegistrationAttemptMapper,
} from '@/identity/database/drizzle/mappers'
import {
  DrizzleClientConsentsRepository,
  DrizzleClientsRepository,
  DrizzleCollaboratorRegistrationAttemptsRepository,
  DrizzleCollaboratorsRepository,
  DrizzleIdentityTransaction,
} from '@/identity/database/drizzle/repositories'
import {
  DrizzleIntakeClientsRepository,
  DrizzleIntakeResponsiblesRepository,
  DrizzleSupportersRepository,
} from '@/identity/database/drizzle/repositories'
import { IdentitySeeder } from '@/identity/database/identity-seeder'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'

@Module({
  imports: [SharedDatabaseModule, IdentityUsersDatabaseModule, LegalCatalogModule],
  providers: [
    DrizzleClientMapper,
    DrizzleClientConsentMapper,
    DrizzleCollaboratorMapper,
    DrizzleCollaboratorRegistrationAttemptMapper,
    DrizzleClientsRepository,
    DrizzleClientConsentsRepository,
    DrizzleCollaboratorsRepository,
    DrizzleCollaboratorRegistrationAttemptsRepository,
    DrizzleIdentityTransaction,
    DrizzleIntakeClientsRepository,
    DrizzleIntakeResponsiblesRepository,
    DrizzleSupportersRepository,
    {
      provide: IDENTITY_REPOSITORIES.clients,
      useExisting: DrizzleClientsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.clientConsents,
      useExisting: DrizzleClientConsentsRepository,
    },
    {
      provide: IDENTITY_REPOSITORIES.collaborators,
      useExisting: DrizzleCollaboratorsRepository,
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
    {
      provide: IDENTITY_REPOSITORIES.supporters,
      useExisting: DrizzleSupportersRepository,
    },
    IdentitySeeder,
  ],
  exports: [
    IdentityUsersDatabaseModule,
    IDENTITY_REPOSITORIES.clients,
    IDENTITY_REPOSITORIES.clientConsents,
    IDENTITY_REPOSITORIES.collaborators,
    IDENTITY_REPOSITORIES.registrationAttempts,
    IDENTITY_REPOSITORIES.transaction,
    IDENTITY_REPOSITORIES.intakeClients,
    IDENTITY_REPOSITORIES.intakeResponsibles,
    IDENTITY_REPOSITORIES.supporters,
    IdentitySeeder,
  ],
})
export class IdentityDatabaseModule {}
