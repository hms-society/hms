import { Module } from '@nestjs/common'

import { CaseManagementDatabaseModule } from '@/case-management/database'
import {
  AddCaseChecklistComplementaryItemController,
  ListChecklistTemplatesController,
  CreateLegalCaseController,
  ListCaseChecklistController,
  ListMyLegalCasesController,
  ReplaceChecklistTemplateController,
  ReviewCaseChecklistGateController,
  GetLegalCaseDetailsController,
  CreatePendingController,
  ListCasePendingsController,
  GetPendingMessageController,
  EditPendingMessageController,
  ApprovePendingMessageController,
  CancelPendingController,
} from '@/case-management/rest/controllers'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database'

@Module({
  imports: [IdentityModule, CaseManagementDatabaseModule, IntakeDatabaseModule],
  controllers: [
    AddCaseChecklistComplementaryItemController,
    ListChecklistTemplatesController,
    CreateLegalCaseController,
    ListCaseChecklistController,
    ListMyLegalCasesController,
    ReplaceChecklistTemplateController,
    ReviewCaseChecklistGateController,
    GetLegalCaseDetailsController,
    CreatePendingController,
    ListCasePendingsController,
    GetPendingMessageController,
    EditPendingMessageController,
    ApprovePendingMessageController,
    CancelPendingController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
