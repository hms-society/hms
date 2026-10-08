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
  GetCaseTeamController,
  ListCaseTeamCandidatesController,
  AddCaseTeamMemberController,
  ChangeCaseTeamMemberRoleController,
  ListCaseTeamHistoryController,
} from '@/case-management/rest/controllers'
import { DocumentsDatabaseModule } from '@/document-engine/database/documents-database.module'
import { ProvisionModule } from '@/shared/provision/provision.module'
import { IdentityModule } from '@/identity/identity.module'
import { IntakeDatabaseModule } from '@/intake/database'
import { CaseIdentityTransactionModule } from '@/shared/database/case-identity-transaction.module'
import { LegalCatalogModule } from '@/legal-catalog/legal-catalog.module'

@Module({
  imports: [
    IdentityModule,
    CaseManagementDatabaseModule,
    IntakeDatabaseModule,
    DocumentsDatabaseModule,
    ProvisionModule,
    CaseIdentityTransactionModule,
    LegalCatalogModule,
  ],
  controllers: [
    AddCaseChecklistComplementaryItemController,
    ListChecklistTemplatesController,
    CreateLegalCaseController,
    ListCaseChecklistController,
    ListMyLegalCasesController,
    ListCaseTeamCandidatesController,
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
    GetCaseTeamController,
    AddCaseTeamMemberController,
    ChangeCaseTeamMemberRoleController,
    ListCaseTeamHistoryController,
  ],
  exports: [CaseManagementDatabaseModule],
})
export class CaseManagementModule {}
