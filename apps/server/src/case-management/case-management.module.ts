import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import {
  AddCaseChecklistComplementaryItemController,
  CreateLegalCaseController,
  ListCaseChecklistController,
  ListMyLegalCasesController,
  ReviewCaseChecklistGateController,
} from '@/case-management/rest/controllers'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database'

@Module({
  imports: [IdentityModule, CaseManagementDatabaseModule, IntakeDatabaseModule],
  controllers: [
    AddCaseChecklistComplementaryItemController,
    CreateLegalCaseController,
    ListCaseChecklistController,
    ListMyLegalCasesController,
    ReviewCaseChecklistGateController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
