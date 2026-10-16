import { Module } from '@nestjs/common'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CaseManagementDatabaseModule } from '@/case-management/database/case-management-database.module'
import { CaseCollaboratorsProvisionModule } from '@/case-management/provision/case-collaborators-provision.module'
import { CaseAccessService } from '@/case-management/access/case-access-service'
import { RepositoryCaseClosureAccessProvider } from '@/case-management/access/repository-case-closure-access-provider'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'

@Module({
  imports: [CaseManagementDatabaseModule, CaseCollaboratorsProvisionModule],
  providers: [
    CaseAccessService,
    { provide: CASE_MANAGEMENT_ACCESS.access, useExisting: CaseAccessService },
    RepositoryCaseClosureAccessProvider,
    {
      provide: CASE_MANAGEMENT_PROVIDERS.caseClosureAccess,
      useExisting: RepositoryCaseClosureAccessProvider,
    },
  ],
  exports: [CASE_MANAGEMENT_ACCESS.access, CASE_MANAGEMENT_PROVIDERS.caseClosureAccess],
})
export class CaseManagementAccessModule {}
