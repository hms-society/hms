import { Module } from '@nestjs/common'
import { IntakeDatabaseModule } from '@/intake/database/intake-database.module'
import { ConsultationDatabaseModule } from '@/consultation/database/consultation-database.module'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import { CaseCollaboratorsProvisionModule } from '@/case-management/provision/case-collaborators-provision.module'
import { RepositoryCaseOpeningSourceProvider } from '@/case-management/provision/repository-case-opening-source-provider'

@Module({
  imports: [
    IntakeDatabaseModule,
    ConsultationDatabaseModule,
    CaseCollaboratorsProvisionModule,
  ],
  providers: [
    RepositoryCaseOpeningSourceProvider,
    {
      provide: CASE_MANAGEMENT_PROVIDERS.openingSource,
      useExisting: RepositoryCaseOpeningSourceProvider,
    },
  ],
  exports: [CaseCollaboratorsProvisionModule, CASE_MANAGEMENT_PROVIDERS.openingSource],
})
export class CaseManagementProvisionModule {}
