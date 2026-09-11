import { Module } from '@nestjs/common'

import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import { DrizzleCollaboratorMapper } from '@/identity/database/drizzle/mappers'
import { DrizzleCollaboratorsRepository } from '@/identity/database/drizzle/repositories'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule, LegalCatalogDatabaseModule],
  providers: [
    DrizzleCollaboratorMapper,
    DrizzleCollaboratorsRepository,
    {
      provide: IDENTITY_REPOSITORIES.collaborators,
      useExisting: DrizzleCollaboratorsRepository,
    },
  ],
  exports: [
    DrizzleCollaboratorMapper,
    DrizzleCollaboratorsRepository,
    IDENTITY_REPOSITORIES.collaborators,
  ],
})
export class IdentityCollaboratorsDatabaseModule {}
