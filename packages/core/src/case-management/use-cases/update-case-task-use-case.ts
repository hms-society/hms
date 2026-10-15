import type {
  CaseHistoriesRepository,
  CaseHistoryTransactionProvider,
} from '../interfaces'
import type { CaseHistoryTaskSnapshot } from '../domain/structures'
import {
  CaseHistoryCategory,
  CaseHistoryKind,
  CaseTaskType as HistoryTaskType,
} from '../domain/structures'
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
    private readonly histories: CaseHistoriesRepository,
    private readonly transaction: CaseHistoryTransactionProvider,
  ) {}

  async execute(request: Request): Promise<CaseTask> {
    return this.transaction.runInTransaction(() => this.persistWithHistory(request))
  }

  private async persistWithHistory(request: Request): Promise<CaseTask> {
    const currentTask = await this.findWritableTask(request)
    const {
      caseId: _caseId,
      caseTaskId: _caseTaskId,
      actorId: _actorId,
      version: _version,
      ...changes
    } = request

    this.normalizeContent(changes)
    const nextType = this.validateTypeChanges(currentTask, changes)
    this.normalizeSchedule(currentTask, changes, nextType)
    await this.resolveAssignees(request.caseId, changes, nextType)
    const now = this.datetimeProvider.now()
    this.applyCompletion(changes, request.actorId, now)
    const updatedTask = await this.caseTasksRepository.replace(
      request.caseTaskId,
      changes,
      request.version,
      now,
    )
    if (!updatedTask) {
      throw new ConflictError('A tarefa ou prazo foi alterada por outra pessoa.')
    }

    await this.appendHistory(updatedTask, request.actorId, now, currentTask)
    return updatedTask
  }

  private async findWritableTask(request: Request): Promise<CaseTask> {
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

    return currentTask
  }
  private normalizeContent(changes: CaseTaskUpdate): void {
    if (changes.description !== undefined) {
      changes.description = changes.description.trim()
      if (!changes.description) throw new BadRequestError('A descrição é obrigatória.')
    }

    if (changes.title !== undefined) {
      changes.title = changes.title.trim()
      if (!changes.title) throw new BadRequestError('O título é obrigatório.')
    }
  }
  private validateTypeChanges(
    currentTask: CaseTask,
    changes: CaseTaskUpdate,
  ): CaseTaskType {
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

    return nextType
  }
  private normalizeSchedule(
    currentTask: CaseTask,
    changes: CaseTaskUpdate,
    nextType: CaseTaskType,
  ): void {
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
  }
  private async resolveAssignees(
    caseId: string,
    changes: CaseTaskUpdate,
    nextType: CaseTaskType,
  ): Promise<void> {
    const nextTypeIsCollective = nextType !== CaseTaskType.InternalTask
    if (nextTypeIsCollective) {
      changes.assigneeIds = [
        ...(await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(
          caseId,
          [],
        )),
      ]
    } else if (changes.assigneeIds) {
      const assigneeIds = [...new Set(changes.assigneeIds)]
      if (assigneeIds.length === 0)
        throw new BadRequestError('Informe ao menos um responsável.')
      if (assigneeIds.length > 1)
        throw new BadRequestError('A tarefa deve ter apenas um responsável.')
      const activeAssigneeIds =
        await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(
          caseId,
          assigneeIds,
        )
      if (activeAssigneeIds.length !== assigneeIds.length) {
        throw new BadRequestError(
          'Todos os responsáveis devem pertencer à equipe ativa do caso.',
        )
      }
      changes.assigneeIds = assigneeIds
    }
  }
  private applyCompletion(changes: CaseTaskUpdate, actorId: string, now: Date): void {
    if (changes.status === CaseTaskStatus.Completed) {
      changes.completedAt = now
      changes.completedById = actorId
    }
    if (changes.status && changes.status !== CaseTaskStatus.Completed) {
      changes.completedAt = null
      changes.completedById = null
    }
  }

  private async appendHistory(
    task: CaseTask,
    actorId: string,
    now: Date,
    before: CaseTask,
  ): Promise<void> {
    const isDeadline = task.type === HistoryTaskType.ProcessDeadline
    const isCompleted = task.status === CaseTaskStatus.Completed
    const kind = isCompleted
      ? isDeadline
        ? CaseHistoryKind.DeadlineCompleted
        : CaseHistoryKind.TaskCompleted
      : isDeadline
        ? CaseHistoryKind.DeadlineUpdated
        : CaseHistoryKind.TaskUpdated
    await this.histories.add({
      caseId: task.caseId,
      kind,
      category: isDeadline ? CaseHistoryCategory.Deadlines : CaseHistoryCategory.Tasks,
      occurredAt: now,
      recordedAt: now,
      actorId,
      title: isDeadline
        ? isCompleted
          ? 'Prazo concluído'
          : 'Prazo atualizado'
        : isCompleted
          ? 'Tarefa concluída'
          : 'Tarefa atualizada',
      description: task.title,
      documents: [],
      sourceKey: `task:${task.id}:${task.version}:${kind}`,
      taskChange: {
        before: this.snapshotTask(before),
        after: this.snapshotTask(task),
      },
    })
  }
  private snapshotTask(task: CaseTask): CaseHistoryTaskSnapshot {
    return {
      taskId: task.id,
      version: task.version,
      type: task.type,
      title: task.title,
      description: task.description,
      customType: task.customType,
      reminders: task.reminders.map((reminder) => ({
        value: reminder.value,
        unit: reminder.unit,
      })),
      completedAt: task.completedAt?.toISOString(),
      completedById: task.completedById,
      plannedDate: task.plannedDate,
      plannedTime: task.plannedTime,
      status: task.status,
      assigneeIds: [...task.assigneeIds],
      blocksCaseClosure: task.blocksCaseClosure,
      completionNote: task.completionNote,
      deletedAt: task.deletedAt?.toISOString(),
    }
  }
}
