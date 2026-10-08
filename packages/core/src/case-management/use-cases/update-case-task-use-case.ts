import type { UseCase } from '#shared/interfaces/use-case'
import {
  BadRequestError,
  ConflictError,
  ForbiddenError,
  NotFoundError,
} from '#shared/domain/errors'
import type { CaseTask, CaseTaskUpdate } from '../domain/entities'
import type { CaseMembersRepository, CaseTasksRepository } from '../interfaces'
import {
  assertValidCaseTaskDate,
  assertUniqueCaseTaskReminders,
  CaseTaskStatus,
  CaseTaskType,
  normalizeCaseTaskTime,
} from '../domain/structures'
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
    const activeMembers =
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(request.caseId, [
        request.actorId,
      ])
    if (!activeMembers.includes(request.actorId)) {
      throw new ForbiddenError('O usuário não possui acesso a este caso.')
    }
    if (currentTask.status === CaseTaskStatus.Completed) {
      throw new BadRequestError('Tarefas concluídas não podem ser editadas.')
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

    if (changes.title !== undefined) {
      changes.title = changes.title.trim()
      if (!changes.title) throw new BadRequestError('O título é obrigatório.')
    }

    if (
      changes.blocksCaseClosure !== undefined &&
      currentTask.type !== CaseTaskType.InternalTask
    ) {
      throw new BadRequestError(
        'Somente tarefas internas podem impedir o encerramento do caso.',
      )
    }

    const nextType = changes.type ?? currentTask.type
    const nextCustomType =
      changes.customType === undefined
        ? currentTask.customType
        : changes.customType?.trim()
    if (nextType === CaseTaskType.Other && !nextCustomType) {
      throw new BadRequestError('Informe o tipo personalizado do item.')
    }

    const nextBlocksCaseClosure =
      changes.blocksCaseClosure ?? currentTask.blocksCaseClosure
    if (nextBlocksCaseClosure && nextType !== CaseTaskType.InternalTask) {
      throw new BadRequestError(
        'Somente tarefas internas podem impedir o encerramento do caso.',
      )
    }

    if (changes.plannedDate !== undefined) {
      const now = this.datetimeProvider.now()
      assertValidCaseTaskDate(changes.plannedDate, now)
    }

    if (changes.reminders !== undefined) {
      assertUniqueCaseTaskReminders(changes.reminders)
    }

    if (changes.plannedTime !== undefined || changes.type !== undefined) {
      changes.plannedTime = normalizeCaseTaskTime(
        nextType,
        changes.plannedTime === undefined
          ? currentTask.plannedTime
          : (changes.plannedTime ?? undefined),
      )
    }

    if (changes.assigneeIds) {
      const assigneeIds = [...new Set(changes.assigneeIds)]
      if (assigneeIds.length === 0)
        throw new BadRequestError('Informe ao menos um responsável.')
      if (assigneeIds.length > 1)
        throw new BadRequestError('A tarefa deve ter apenas um responsável.')
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
    if (changes.status === CaseTaskStatus.Completed) {
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
