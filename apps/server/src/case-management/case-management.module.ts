import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import {
  AddCaseChecklistComplementaryItemController,
  CreateLegalCaseController,
  ListCaseChecklistController,
  ListMyLegalCasesController,
  ReviewCaseChecklistGateController,
  GetLegalCaseDetailsController,
  GetLegalCaseByIntakeController,
} from '@/case-management/rest/controllers'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeModule } from '@/intake/intake.module'

@Module({
  imports: [IdentityModule, CaseManagementDatabaseModule, IntakeModule],
  controllers: [
    AddCaseChecklistComplementaryItemController,
    CreateLegalCaseController,
    ListCaseChecklistController,
    ListMyLegalCasesController,
    ReviewCaseChecklistGateController,
    GetLegalCaseDetailsController,
    GetLegalCaseByIntakeController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
