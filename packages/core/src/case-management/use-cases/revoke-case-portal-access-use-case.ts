import type { UseCase } from '#shared/interfaces/use-case'

import type { CasePortalAccessGrant } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type {
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../interfaces'

type Request = {
  grantId: string
  caseId: string
  collaboratorId: string
  isAdministrator: boolean
}

export class RevokeCasePortalAccessUseCase
  implements UseCase<Request, CasePortalAccessGrant>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly grantsRepository: CasePortalAccessGrantsRepository,
  ) {}

  async execute(request: Request): Promise<CasePortalAccessGrant> {
    const canAccessCase = request.isAdministrator
      ? Boolean(await this.legalCasesRepository.findById(request.caseId))
      : (await this.legalCasesRepository.listByTeamMember(request.collaboratorId)).some(
          (legalCase) => legalCase.id === request.caseId,
        )

    if (!canAccessCase) {
      throw new LegalCaseNotFoundError()
    }

    const grant = await this.grantsRepository.revoke(request.grantId, request.caseId)
    if (!grant) throw new LegalCaseNotFoundError()
    return grant
  }
}
