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
  DrizzleCaseTaskMapper,
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
  DrizzleCaseTasksRepository,
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
    DrizzleCaseTaskMapper,
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
    DrizzleCaseTasksRepository,
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
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.caseTasks,
      useExisting: DrizzleCaseTasksRepository,
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
    CASE_MANAGEMENT_REPOSITORIES.caseTasks,
    CaseCollaboratorsProvisionModule,
    CaseManagementSeeder,
    CaseManagementTransactionScopeProvider,
  ],
})
export class CaseManagementDatabaseModule {}
