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
  GrantCasePortalAccessController,
  ListCasePortalAccessController,
  RevokeCasePortalAccessController,
  ListCasePortalPendingChecklistController,
  UploadCasePortalDocumentController,
  GetThirdPartyPortalCaseController,
  CreatePendingController,
  ListCasePendingsController,
  GetPendingMessageController,
  EditPendingMessageController,
  ApprovePendingMessageController,
  CancelPendingController,
  HomologateCaseDossierController,
  CreateCaseTaskController,
  ListCaseTasksController,
  UpdateCaseTaskController,
  DeleteCaseTaskController,
} from '@/case-management/rest/controllers'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database'

@Module({
  imports: [
    IdentityModule,
    CaseManagementDatabaseModule,
    IntakeDatabaseModule,
    DocumentsDatabaseModule,
    ProvisionModule,
  ],
  controllers: [
    AddCaseChecklistComplementaryItemController,
    ListChecklistTemplatesController,
    CreateLegalCaseController,
    ListCaseChecklistController,
    ListMyLegalCasesController,
    ReplaceChecklistTemplateController,
    ReviewCaseChecklistGateController,
    HomologateCaseDossierController,
    GetLegalCaseDetailsController,
    GrantCasePortalAccessController,
    ListCasePortalAccessController,
    RevokeCasePortalAccessController,
    ListCasePortalPendingChecklistController,
    UploadCasePortalDocumentController,
    GetThirdPartyPortalCaseController,
    CreatePendingController,
    ListCasePendingsController,
    GetPendingMessageController,
    EditPendingMessageController,
    ApprovePendingMessageController,
    CancelPendingController,
    CreateCaseTaskController,
    ListCaseTasksController,
    UpdateCaseTaskController,
    DeleteCaseTaskController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
