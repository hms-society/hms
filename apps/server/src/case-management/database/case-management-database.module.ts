import { Module } from '@nestjs/common'

import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import {
  DrizzleCaseMemberMapper,
  DrizzleLegalCaseMapper,
} from '@/case-management/database/drizzle/mappers'
import {
  DrizzleCaseMembersRepository,
  DrizzleLegalCasesRepository,
} from '@/case-management/database/drizzle/repositories'
import { CaseManagementSeeder } from '@/case-management/database/case-management-seeder'
import { SharedDatabaseModule } from '@/shared/database/drizzle/database.module'

@Module({
  imports: [SharedDatabaseModule],
  providers: [
    DrizzleCaseMemberMapper,
    DrizzleLegalCaseMapper,
    DrizzleCaseMembersRepository,
    DrizzleLegalCasesRepository,
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
    CASE_MANAGEMENT_REPOSITORIES.caseMembers,
    CASE_MANAGEMENT_REPOSITORIES.legalCases,
    CaseManagementSeeder,
  ],
})
export class CaseManagementDatabaseModule {}
