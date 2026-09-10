import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import {
  AddCaseChecklistComplementaryItemController,
  ListChecklistTemplatesController,
  ListCaseChecklistController,
  ListMyLegalCasesController,
  ReplaceChecklistTemplateController,
  ReviewCaseChecklistGateController,
} from '@/case-management/rest/controllers'
import { IdentityModule } from '@/identity/identity.module'

@Module({
  imports: [IdentityModule, CaseManagementDatabaseModule],
  controllers: [
    AddCaseChecklistComplementaryItemController,
    ListChecklistTemplatesController,
    ListCaseChecklistController,
    ListMyLegalCasesController,
    ReplaceChecklistTemplateController,
    ReviewCaseChecklistGateController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
