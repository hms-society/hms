import { Inject, Injectable } from '@nestjs/common'
import type { CaseAccessProvider } from '@hms/core/case-management/interfaces'
import { AuthorizeCaseAccessUseCase } from '@hms/core/case-management/use-cases'
import type { CaseAccessIntent } from '@hms/core/case-management/domain/structures'
import type {
  CaseMembersRepository,
  LegalCasesRepository,
  CaseCollaboratorsProvider,
} from '@hms/core/case-management/interfaces'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { CASE_MANAGEMENT_PROVIDERS } from '@/case-management/constants/case-management-providers'

@Injectable()
export class CaseAccessService implements CaseAccessProvider {
  private readonly useCase: AuthorizeCaseAccessUseCase

  constructor(
    @Inject(CASE_MANAGEMENT_REPOSITORIES.legalCases)
    legalCasesRepository: LegalCasesRepository,
    @Inject(CASE_MANAGEMENT_REPOSITORIES.caseMembers)
    caseMembersRepository: CaseMembersRepository,
    @Inject(CASE_MANAGEMENT_PROVIDERS.collaborators)
    collaboratorsProvider: CaseCollaboratorsProvider,
  ) {
    this.useCase = new AuthorizeCaseAccessUseCase(
      legalCasesRepository,
      caseMembersRepository,
      collaboratorsProvider,
    )
  }

  authorize(params: {
    caseId: string
    actorId: string
    intent: CaseAccessIntent
    expectedClientId?: string
  }): Promise<void> {
    return this.useCase.execute(params)
  }
}
