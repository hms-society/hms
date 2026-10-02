import type { UseCase } from '#shared/interfaces/use-case'

import type { CasePortalAccessGrant, LegalCase } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { LegalCasesRepository } from '../interfaces'

export type ThirdPartyPortalCaseView = {
  caseId: string
  publicCode: string
  title: string
  clientName: string
  status?: LegalCase['status']
  intakeId: string
  updatedAt: Date
  canUpload: boolean
  canViewCaseStatus: boolean
  canViewIntakeStatus: boolean
}

type Request = {
  caseId: string
  grant: CasePortalAccessGrant
}

export class GetThirdPartyPortalCaseUseCase
  implements UseCase<Request, ThirdPartyPortalCaseView>
{
  constructor(private readonly legalCasesRepository: LegalCasesRepository) {}

  async execute({ caseId, grant }: Request): Promise<ThirdPartyPortalCaseView> {
    const legalCase = await this.legalCasesRepository.getCaseDetails(caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()

    return {
      caseId: legalCase.id,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      clientName: legalCase.clientName,
      status: grant.canViewCaseStatus ? legalCase.status : undefined,
      intakeId: legalCase.intakeId,
      updatedAt: legalCase.updatedAt,
      canUpload: grant.canUpload,
      canViewCaseStatus: grant.canViewCaseStatus,
      canViewIntakeStatus: grant.canViewIntakeStatus,
    }
  }
}
