import { Module } from '@nestjs/common'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import {
  DrizzleCaseChecklistItemMapper,
  DrizzleCaseMemberMapper,
  DrizzleLegalCaseMapper,
} from '@/case-management/database/drizzle/mappers'
import {
  DrizzleCaseChecklistItemsRepository,
  DrizzleCaseMembersRepository,
  DrizzleLegalCasesRepository,
} from '@/case-management/database/drizzle/repositories'
import { CaseManagementSeeder } from '@/case-management/database/case-management-seeder'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleCaseChecklistItemMapper,
    DrizzleCaseMemberMapper,
    DrizzleLegalCaseMapper,
    DrizzleCaseChecklistItemsRepository,
    DrizzleCaseMembersRepository,
    DrizzleLegalCasesRepository,
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
      useExisting: DrizzleCaseChecklistItemsRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.caseMembers,
      useExisting: DrizzleCaseMembersRepository,
    },
    {
      provide: CASE_MANAGEMENT_REPOSITORIES.legalCases,
      useExisting: DrizzleLegalCasesRepository,
    },
    CaseManagementSeeder,
  ],
  exports: [
    CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems,
    CASE_MANAGEMENT_REPOSITORIES.caseMembers,
    CASE_MANAGEMENT_REPOSITORIES.legalCases,
    CaseManagementSeeder,
  ],
})
export class CaseManagementDatabaseModule {}
