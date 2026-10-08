import { Module } from '@nestjs/common'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import {
  DrizzleCaseChecklistItemMapper,
  DrizzleCaseMemberMapper,
  DrizzleChecklistTemplateItemMapper,
  DrizzleChecklistTemplateMapper,
  DrizzleLegalCaseMapper,
  DrizzleCasePortalAccessGrantMapper,
  DrizzleCaseTeamHistoryMapper,
  DrizzleCaseTeamOperationMapper,
} from '@/case-management/database/drizzle/mappers'
import {
  DrizzleCaseChecklistItemsRepository,
  DrizzleCaseMembersRepository,
  DrizzleChecklistTemplateItemsRepository,
  DrizzleChecklistTemplatesRepository,
  DrizzleLegalCasesRepository,
  DrizzleCasePortalAccessGrantsRepository,
  DrizzlePendingsRepository,
  DrizzleCaseTeamHistoriesRepository,
  DrizzleCaseTeamOperationsRepository,
} from '@/case-management/database/drizzle/repositories'
import { CaseManagementSeeder } from '@/case-management/database/case-management-seeder'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'
import { CaseManagementTransactionScopeProvider } from '@/case-management/database/drizzle/case-management-transaction-scope-provider'
import { CaseCollaboratorsProvisionModule } from '@/case-management/provision/case-collaborators-provision.module'

@Module({
  imports: [SharedDatabaseModule, CaseCollaboratorsProvisionModule],
  providers: [
    DrizzleCaseChecklistItemMapper,
    DrizzleCaseMemberMapper,
    DrizzleCaseTeamHistoryMapper,
    DrizzleCaseTeamOperationMapper,
    DrizzleChecklistTemplateItemMapper,
    DrizzleChecklistTemplateMapper,
    DrizzleLegalCaseMapper,
    DrizzleCasePortalAccessGrantMapper,
    DrizzleCaseChecklistItemsRepository,
    DrizzleCaseMembersRepository,
    DrizzleCaseTeamHistoriesRepository,
    DrizzleCaseTeamOperationsRepository,
    DrizzleChecklistTemplateItemsRepository,
    DrizzleChecklistTemplatesRepository,
    DrizzleLegalCasesRepository,
    DrizzleCasePortalAccessGrantsRepository,
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants,
      useExisting: DrizzleCasePortalAccessGrantsRepository,
    },
    DrizzlePendingsRepository,
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
      useExisting: DrizzleCaseChecklistItemsRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.caseMembers,
      useExisting: DrizzleCaseMembersRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.caseTeamHistories,
      useExisting: DrizzleCaseTeamHistoriesRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.caseTeamOperations,
      useExisting: DrizzleCaseTeamOperationsRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.checklistTemplateItems,
      useExisting: DrizzleChecklistTemplateItemsRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.checklistTemplates,
      useExisting: DrizzleChecklistTemplatesRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.legalCases,
      useExisting: DrizzleLegalCasesRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.pendings,
      useExisting: DrizzlePendingsRepository,
    },
    CaseManagementSeeder,
    CaseManagementTransactionScopeProvider,
  ],
  exports: [
    CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    CASE_MANAGEMENT_REPOSITORIES.caseMembers,
    CASE_MANAGEMENT_REPOSITORIES.caseTeamHistories,
    CASE_MANAGEMENT_REPOSITORIES.caseTeamOperations,
    CASE_MANAGEMENT_REPOSITORIES.checklistTemplateItems,
    CASE_MANAGEMENT_REPOSITORIES.checklistTemplates,
    CASE_MANAGEMENT_REPOSITORIES.legalCases,
    CASE_MANAGEMENT_REPOSITORIES.casePortalAccessGrants,
    CASE_MANAGEMENT_REPOSITORIES.pendings,
    CaseManagementSeeder,
    CaseManagementTransactionScopeProvider,
  ],
})
export class CaseManagementDatabaseModule {}
