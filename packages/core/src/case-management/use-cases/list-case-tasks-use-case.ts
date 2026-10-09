import type { UseCase } from '#shared/interfaces/use-case'
import { ForbiddenError } from '#shared/domain/errors'
import type { CaseTask } from '../domain/entities'
import type { CaseMembersRepository, CaseTasksRepository } from '../interfaces'

type Request = { caseId: string; actorId: string }

export class ListCaseTasksUseCase implements UseCase<Request, readonly CaseTask[]> {
  constructor(
    private readonly caseTasksRepository: CaseTasksRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
  ) {}

  async execute(request: Request) {
    const activeMembers =
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(request.caseId, [
        request.actorId,
      ])
    if (activeMembers.length !== 1) {
      throw new ForbiddenError('O usuário não possui acesso a este caso.')
    }

    return this.caseTasksRepository.listByCaseId(request.caseId)
  }
}
