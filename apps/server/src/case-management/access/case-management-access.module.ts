import { Module } from '@nestjs/common'
import { CASE_MANAGEMENT_ACCESS } from '@/case-management/constants/case-management-access'
import { CaseManagementDatabaseModule } from '@/case-management/database/case-management-database.module'
import { CaseCollaboratorsProvisionModule } from '@/case-management/provision/case-collaborators-provision.module'
import { CaseAccessService } from '@/case-management/access/case-access-service'

@Module({
  imports: [CaseManagementDatabaseModule, CaseCollaboratorsProvisionModule],
  providers: [
    CaseAccessService,
    { provide: CASE_MANAGEMENT_ACCESS.access, useExisting: CaseAccessService },
  ],
  exports: [CASE_MANAGEMENT_ACCESS.access],
})
export class CaseManagementAccessModule {}
