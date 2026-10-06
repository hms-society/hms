import type { UseCase } from '#shared/interfaces/use-case'
import { BadRequestError, ConflictError, NotFoundError } from '#shared/domain/errors'
import type { CaseTask, CaseTaskUpdate } from '../domain/entities'
import type { CaseMembersRepository, CaseTasksRepository } from '../interfaces'
import { CaseTaskStatus, CaseTaskType } from '../domain/structures'
import type { DatetimeProvider } from '#shared/interfaces'

type Request = CaseTaskUpdate & {
  caseId: string
  caseTaskId: string
  actorId: string
  version: number
}

export class UpdateCaseTaskUseCase implements UseCase<Request, CaseTask> {
  constructor(
    private readonly caseTasksRepository: CaseTasksRepository,
    private readonly caseMembersRepository: CaseMembersRepository,
    private readonly datetimeProvider: DatetimeProvider,
  ) {}

  async execute(request: Request): Promise<CaseTask> {
    const currentTask = await this.caseTasksRepository.findById(request.caseTaskId)
    if (!currentTask || currentTask.caseId !== request.caseId) {
      throw new NotFoundError('Tarefa ou prazo não encontrado.')
    }

    const {
      caseId: _caseId,
      caseTaskId: _caseTaskId,
      actorId: _actorId,
      version: _version,
      ...changes
    } = request

    if (changes.description !== undefined) {
      changes.description = changes.description.trim()
      if (!changes.description) throw new BadRequestError('A descrição é obrigatória.')
    }

    const nextType = changes.type ?? currentTask.type
    const nextCustomType =
      changes.customType === undefined ? currentTask.customType : changes.customType?.trim()
    if (nextType === CaseTaskType.Other && !nextCustomType) {
      throw new BadRequestError('Informe o tipo personalizado do item.')
    }

    if (changes.plannedDate !== undefined) {
      const now = this.datetimeProvider.now()
      const plannedDate = new Date(`${changes.plannedDate}T00:00:00.000Z`)
      const currentDate = new Date(now.toISOString().slice(0, 10) + 'T00:00:00.000Z')
      if (!/^\d{4}-\d{2}-\d{2}$/.test(changes.plannedDate) || plannedDate < currentDate) {
        throw new BadRequestError('A data prevista não pode ser anterior à data atual.')
      }
    }

    if (changes.assigneeIds) {
      const assigneeIds = [...new Set(changes.assigneeIds)]
      const activeAssigneeIds =
        await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(
          request.caseId,
          assigneeIds,
        )
      if (activeAssigneeIds.length !== assigneeIds.length) {
        throw new BadRequestError(
          'Todos os responsáveis devem pertencer à equipe ativa do caso.',
        )
      }
      changes.assigneeIds = assigneeIds
    }

    const now = this.datetimeProvider.now()
    if (changes.status === CaseTaskStatus.Completed && currentTask.status !== CaseTaskStatus.Completed) {
      changes.completedAt = now
      changes.completedById = request.actorId
    }
    if (changes.status && changes.status !== CaseTaskStatus.Completed) {
      changes.completedAt = null
      changes.completedById = null
    }

    const updatedTask = await this.caseTasksRepository.replace(
      request.caseTaskId,
      changes,
      request.version,
      now,
    )
    if (!updatedTask) {
      throw new ConflictError('A tarefa ou prazo foi alterada por outra pessoa.')
    }

    return updatedTask
  }
}
