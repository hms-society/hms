import type { UseCase } from '#shared/interfaces/use-case'

import type { CasePortalAccessGrant } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type { CasePortalAccessGrantsRepository, LegalCasesRepository } from '../interfaces'

type Request = {
  caseId: string
  tokenHash: string
  collaboratorId: string
  canUpload: boolean
  expiresAt?: Date
}

export class GrantCasePortalAccessUseCase implements UseCase<Request, CasePortalAccessGrant> {
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly grantsRepository: CasePortalAccessGrantsRepository,
  ) {}

  async execute(request: Request): Promise<CasePortalAccessGrant> {
    const assignedCases = await this.legalCasesRepository.listByTeamMember(request.collaboratorId)
    if (!assignedCases.some((legalCase) => legalCase.id === request.caseId)) {
      throw new LegalCaseNotFoundError()
    }

    return this.grantsRepository.add({
      caseId: request.caseId,
      tokenHash: request.tokenHash,
      canView: true,
      canUpload: request.canUpload,
      expiresAt: request.expiresAt,
      grantedBy: request.collaboratorId,
    })
  }
}
