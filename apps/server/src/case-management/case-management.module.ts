import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import { GetLegalCaseByIntakeController } from '@/case-management/rest/controllers'
import { IdentityModule } from '@/identity/identity.module'

@Module({
  imports: [CaseManagementDatabaseModule, IdentityModule],
  controllers: [GetLegalCaseByIntakeController],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
