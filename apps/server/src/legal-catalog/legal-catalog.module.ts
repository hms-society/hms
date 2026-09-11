import { Module } from '@nestjs/common'

import { AuthModule } from '@/identity/auth.module'
import { IdentityCollaboratorsDatabaseModule } from '@/identity/database/identity-collaborators-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import {
  CreateLegalAreaController,
  CreateLegalTopicController,
  ListAdminLegalAreasController,
  ListLegalAreasController,
  ListLegalTopicsController,
  UpdateLegalAreaController,
  UpdateLegalTopicController,
} from '@/legal-catalog/rest/controllers'

@Module({
  imports: [
    AuthModule,
    IdentityCollaboratorsDatabaseModule,
    LegalCatalogDatabaseModule,
    ProvisionModule,
  ],
  controllers: [
    CreateLegalAreaController,
    CreateLegalTopicController,
    ListAdminLegalAreasController,
    ListLegalAreasController,
    ListLegalTopicsController,
    UpdateLegalAreaController,
    UpdateLegalTopicController,
  ],
  exports: [LegalCatalogDatabaseModule],
})
export class LegalCatalogModule {}
