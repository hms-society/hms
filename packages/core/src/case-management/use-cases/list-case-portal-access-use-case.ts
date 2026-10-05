import type { UseCase } from '#shared/interfaces/use-case'

import type { CasePortalAccessGrant } from '../domain/entities'
import { LegalCaseNotFoundError } from '../domain/errors'
import type {
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../interfaces'

type Request = {
  caseId: string
  collaboratorId: string
  isAdministrator: boolean
}

export class ListCasePortalAccessUseCase
  implements UseCase<Request, readonly CasePortalAccessGrant[]>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly grantsRepository: CasePortalAccessGrantsRepository,
  ) {}

  async execute(request: Request): Promise<readonly CasePortalAccessGrant[]> {
    const canAccessCase = request.isAdministrator
      ? Boolean(await this.legalCasesRepository.findById(request.caseId))
      : (await this.legalCasesRepository.listByTeamMember(request.collaboratorId)).some(
          (legalCase) => legalCase.id === request.caseId,
        )

    if (!canAccessCase) throw new LegalCaseNotFoundError()

    return this.grantsRepository.findByCaseId(request.caseId)
  }
}
