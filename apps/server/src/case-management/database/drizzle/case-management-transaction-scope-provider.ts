import { Inject, Injectable } from '@nestjs/common'
import type {
  CaseTeamScope,
  CaseCollaboratorsProvider,
} from '@hms/core/case-management/interfaces'
import type { Database } from '@/shared/database/drizzle/drizzle-client'
import { DrizzleClient } from '@/shared/database/drizzle/drizzle-client'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'
import {
  DrizzleCaseMemberMapper,
  DrizzleCaseTeamHistoryMapper,
  DrizzleCaseTeamOperationMapper,
  DrizzleLegalCaseMapper,
} from '@/case-management/database/drizzle/mappers'
import {
  DrizzleCaseMembersRepository,
  DrizzleCaseTeamHistoriesRepository,
  DrizzleCaseTeamOperationsRepository,
  DrizzleLegalCasesRepository,
} from '@/case-management/database/drizzle/repositories'

type CaseManagementDatabaseExecutor = Parameters<
  Parameters<Database['transaction']>[0]
>[0]

@Injectable()
export class CaseManagementTransactionScopeProvider {
  constructor(
    private readonly drizzleClient: DrizzleClient,
    private readonly caseMemberMapper: DrizzleCaseMemberMapper,
    private readonly legalCaseMapper: DrizzleLegalCaseMapper,
    private readonly historyMapper: DrizzleCaseTeamHistoryMapper,
    private readonly teamOperationMapper: DrizzleCaseTeamOperationMapper,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    private readonly collaboratorsProvider: CaseCollaboratorsProvider,
  ) {}

  create(database: CaseManagementDatabaseExecutor): CaseTeamScope {
    return {
      legalCasesRepository: new DrizzleLegalCasesRepository(
        this.drizzleClient,
        this.legalCaseMapper,
        database,
      ),
      caseMembersRepository: new DrizzleCaseMembersRepository(
        this.drizzleClient,
        this.caseMemberMapper,
        database,
      ),
      caseTeamHistoriesRepository: new DrizzleCaseTeamHistoriesRepository(
        this.drizzleClient,
        this.historyMapper,
        database,
      ),
      caseTeamOperationsRepository: new DrizzleCaseTeamOperationsRepository(
        this.drizzleClient,
        this.teamOperationMapper,
        database,
      ),
      caseCollaboratorsProvider: this.collaboratorsProvider,
    }
  }
}
