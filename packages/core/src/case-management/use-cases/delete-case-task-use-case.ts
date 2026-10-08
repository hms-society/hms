import type { UseCase } from '#shared/interfaces/use-case'
import { BadRequestError, ConflictError, NotFoundError } from '#shared/domain/errors'
import { CaseTaskStatus } from '../domain/structures'
import type { CaseTask } from '../domain/entities'
import type { CaseTasksRepository } from '../interfaces'
import type { DatetimeProvider } from '#shared/interfaces'

type Request = {
  caseId: string
  caseTaskId: string
  version: number
}

export class DeleteCaseTaskUseCase implements UseCase<Request, CaseTask> {
  constructor(
    private readonly caseTasksRepository: CaseTasksRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<CaseTask> {
    const currentTask = await this.caseTasksRepository.findById(request.caseTaskId)
    if (!currentTask || currentTask.caseId !== request.caseId) {
      throw new NotFoundError('Tarefa ou prazo não encontrado.')
    }
    if (currentTask.status === CaseTaskStatus.Completed) {
      throw new BadRequestError('Tarefas concluídas não podem ser excluídas.')
    }

    const now = this.datetimeProvider.now()
    const deletedTask = await this.caseTasksRepository.remove(
      request.caseTaskId,
      request.version,
      now,
      now,
    )
    if (!deletedTask) {
      throw new ConflictError('A tarefa ou prazo foi alterada por outra pessoa.')
    }

    return deletedTask
  }
}
