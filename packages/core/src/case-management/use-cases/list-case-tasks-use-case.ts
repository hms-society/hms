import type { UseCase } from '#shared/interfaces/use-case'
import { CaseAccessIntent } from '../domain/structures'
import type { CaseTask } from '../domain/entities'
import type { CaseAccessProvider, CaseTasksRepository } from '../interfaces'

type Request = { caseId: string; actorId: string }

export class ListCaseTasksUseCase implements UseCase<Request, readonly CaseTask[]> {
  constructor(
    private readonly caseTasksRepository: CaseTasksRepository,
    private readonly caseAccessProvider: CaseAccessProvider,
  ) {}

  async execute(request: Request) {
    await this.caseAccessProvider.authorize({
      ...request,
      intent: CaseAccessIntent.ReadContent,
    })

    return this.caseTasksRepository.listByCaseId(request.caseId)
  }
}
