import type { UseCase } from '#shared/interfaces/use-case'
import { ForbiddenError } from '#shared/domain/errors'

import type { CaseChecklistItem } from '../domain/entities'
import { CaseChecklistItemStatus } from '../domain/structures'
import { LegalCaseNotFoundError } from '../domain/errors'
import type {
  CaseChecklistItemsRepository,
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../interfaces'

type Request = {
  caseId: string
  tokenHash: string
}

export class ListCasePortalPendingChecklistUseCase
  implements UseCase<Request, readonly CaseChecklistItem[]>
{
  constructor(
    private readonly legalCasesRepository: LegalCasesRepository,
    private readonly caseChecklistItemsRepository: CaseChecklistItemsRepository,
    private readonly grantsRepository: CasePortalAccessGrantsRepository,
  ) {}

  async execute(request: Request): Promise<readonly CaseChecklistItem[]> {
    const legalCase = await this.legalCasesRepository.findById(request.caseId)
    if (!legalCase) throw new LegalCaseNotFoundError()

    const grant = await this.grantsRepository.findActiveByTokenHashAndCase(
      request.tokenHash,
      request.caseId,
    )
    if (!grant) throw new ForbiddenError('O usuário não possui acesso a este caso.')

    const checklistItems = await this.caseChecklistItemsRepository.listByCaseId(
      request.caseId,
    )

    return checklistItems.filter(
      (item) =>
        item.status === CaseChecklistItemStatus.Pending ||
        item.status === CaseChecklistItemStatus.InAnalysis,
    )
  }
}
