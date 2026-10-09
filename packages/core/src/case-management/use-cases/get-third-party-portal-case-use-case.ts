import type { UseCase } from '#shared/interfaces/use-case'

import type { CasePortalAccessGrant, LegalCase } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { LegalCasesRepository } from '../interfaces'
import type { ClientsRepository } from '../../identity/interfaces/clients-repository'

export type ThirdPartyPortalCaseView = {
  caseId: string
  publicCode: string
  title: string
  clientName: string
  status?: LegalCase['status']
  intakeId?: string
  updatedAt?: Date
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
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly clientsRepository: ClientsRepository,
  ) {}

  async execute({ caseId, grant }: Request): Promise<ThirdPartyPortalCaseView> {
    const legalCase = await this.legalCasesRepository.findById(caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()
    const client = await this.clientsRepository.findById(legalCase.clientId)
    if (!client) throw new LegalCaseNotFoundError()
    const clientName =
      client.type === 'natural' ? client.name : client.tradeName || client.legalName

    return {
      caseId: legalCase.id,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      clientName,
      status: grant.canViewCaseStatus ? legalCase.status : undefined,
      ...(grant.canViewIntakeStatus ? { intakeId: legalCase.intakeId } : {}),
      ...(grant.canViewCaseStatus ? { updatedAt: legalCase.updatedAt } : {}),
      canUpload: grant.canUpload,
      canViewCaseStatus: grant.canViewCaseStatus,
      canViewIntakeStatus: grant.canViewIntakeStatus,
    }
  }
}
