import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import {
  CompleteCaseChecklistController,
  ListMyLegalCasesController,
  ReviewCaseChecklistGateController,
} from '@/case-management/rest/controllers'
import { IdentityModule } from '@/identity/identity.module'

@Module({
  imports: [IdentityModule, CaseManagementDatabaseModule],
  controllers: [
    CompleteCaseChecklistController,
    ListMyLegalCasesController,
    ReviewCaseChecklistGateController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
