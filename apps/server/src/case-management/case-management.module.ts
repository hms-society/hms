import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import {
  AddCaseChecklistComplementaryItemController,
  ListCaseChecklistController,
  ListMyLegalCasesController,
  ReviewCaseChecklistGateController,
} from '@/case-management/rest/controllers'
import { IdentityModule } from '@/identity/identity.module'

@Module({
  imports: [IdentityModule, CaseManagementDatabaseModule],
  controllers: [
    AddCaseChecklistComplementaryItemController,
    ListCaseChecklistController,
    ListMyLegalCasesController,
    ReviewCaseChecklistGateController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
