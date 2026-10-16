import type { UseCase } from '#shared/interfaces/use-case'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'

import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { CaseClosureError, LegalCaseNotFoundError } from '../domain/errors'
import { CaseMemberRole, LegalCaseLifecycleStatus } from '../domain/structures'
import type { CaseClosureAccessProvider, CaseClosureRepository } from '../interfaces'
import type { LegalCase } from '../domain/entities/legal-case'

type Request = {
  caseId: string
  actorId: string
  reason: string
}

export class ReopenLegalCaseUseCase implements UseCase<Request, LegalCase> {
  constructor(
    private readonly closureRepository: CaseClosureRepository,
    private readonly accessProvider: CaseClosureAccessProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<LegalCase> {
    const snapshot = await this.closureRepository.getSnapshot(request.caseId)
    if (!snapshot) throw new LegalCaseNotFoundError()

    const actorAccess = await this.accessProvider.getActorAccess(
      request.caseId,
      request.actorId,
    )
    if (
      !actorAccess.isAuthenticated ||
      !actorAccess.isActive ||
      !actorAccess.isEligible ||
      actorAccess.role !== CaseMemberRole.Manager
    ) {
      throw new ForbiddenError('Somente um gestor ativo e elegível pode reabrir o caso.')
    }

    const reason = request.reason.trim()
    if (!reason) throw new CaseClosureError('Informe o motivo da reabertura.')

    const lifecycleStatus = snapshot.legalCase.lifecycleStatus
    if (!lifecycleStatus) {
      throw new CaseClosureError('O ciclo de vida do caso ainda não foi carregado.')
    }
    if (lifecycleStatus !== LegalCaseLifecycleStatus.Closed) {
      throw new CaseClosureError('Este caso não está encerrado.')
    }

    const legalCase = await this.closureRepository.reopen({
      caseId: request.caseId,
      reason,
      actorId: request.actorId,
      occurredAt: this.datetimeProvider.now(),
    })
    if (!legalCase) {
      throw new CaseClosureError(
        'O caso mudou durante a reabertura. Atualize os dados e tente novamente.',
      )
    }
    return legalCase
  }
}
