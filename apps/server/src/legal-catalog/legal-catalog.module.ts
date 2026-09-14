import { Module } from '@nestjs/common'

import { AuthModule } from '@/identity/auth.module'
import { ActiveAdminGuard } from '@/identity/guards'
import { IdentityDatabaseModule } from '@/identity/database/identity-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { LegalCatalogDatabaseModule } from '@/legal-catalog/database/legal-catalog-database.module'
import { LegalCatalogProvisionModule } from '@/legal-catalog/provision/legal-catalog-provision.module'
import {
  ChangeDynamicFormAvailabilityController,
  DeleteDynamicFormController,
  DuplicateDynamicFormController,
  FindDynamicFormNameConflictController,
  GetDynamicFormUsageImpactController,
  ListDynamicFormsForAdministrationController,
  ListLegalAreasController,
  ListLegalTopicsController,
} from '@/legal-catalog/rest/controllers'

@Module({
  imports: [
    AuthModule,
    IdentityDatabaseModule,
    LegalCatalogDatabaseModule,
    LegalCatalogProvisionModule,
    ProvisionModule,
  ],
  controllers: [
    ListLegalAreasController,
    ListLegalTopicsController,
    ListDynamicFormsForAdministrationController,
    FindDynamicFormNameConflictController,
    DuplicateDynamicFormController,
    GetDynamicFormUsageImpactController,
    ChangeDynamicFormAvailabilityController,
    DeleteDynamicFormController,
  ],
  providers: [ActiveAdminGuard],
  exports: [LegalCatalogDatabaseModule],
})
export class LegalCatalogModule {}
