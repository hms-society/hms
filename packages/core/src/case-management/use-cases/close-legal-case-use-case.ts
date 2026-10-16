import type { UseCase } from '#shared/interfaces/use-case'
import type { DatetimeProvider } from '#shared/interfaces/datetime-provider'

import { ForbiddenError } from '#shared/domain/errors/forbidden-error'
import { CaseClosureError, LegalCaseNotFoundError } from '../domain/errors'
import type { CaseClosureOutcome } from '../domain/structures/case-closure-outcome'
import { CaseMemberRole, LegalCaseLifecycleStatus } from '../domain/structures'
import type { CaseClosureAccessProvider, CaseClosureRepository } from '../interfaces'
import type { CloseCaseResult } from '../interfaces/case-closure-repository'

type Request = {
  caseId: string
  actorId: string
  outcome: CaseClosureOutcome
  notes?: string
}

export class CloseLegalCaseUseCase implements UseCase<Request, CloseCaseResult> {
  constructor(
    private readonly closureRepository: CaseClosureRepository,
    private readonly accessProvider: CaseClosureAccessProvider,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<CloseCaseResult> {
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
      throw new ForbiddenError('Somente um gestor ativo e elegível pode encerrar o caso.')
    }

    const lifecycleStatus = snapshot.legalCase.lifecycleStatus
    if (!lifecycleStatus) {
      throw new CaseClosureError('O ciclo de vida do caso ainda não foi carregado.')
    }
    if (lifecycleStatus !== LegalCaseLifecycleStatus.Active) {
      throw new CaseClosureError('Este caso já está encerrado.')
    }

    const notes = request.notes?.trim() || undefined
    return this.closureRepository.close({
      caseId: request.caseId,
      outcome: request.outcome,
      notes,
      actorId: request.actorId,
      occurredAt: this.datetimeProvider.now(),
    })
  }
}
