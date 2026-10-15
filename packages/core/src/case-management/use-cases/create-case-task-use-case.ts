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
import { BadRequestError, ForbiddenError } from '#shared/domain/errors'
import type { CaseMembersRepository, CaseTasksRepository } from '../interfaces'
import type { CaseTask, CaseTaskReminderCreation } from '../domain/entities'
import {
  assertValidCaseTaskDate,
  assertUniqueCaseTaskReminders,
  CaseTaskSource,
  CaseTaskStatus,
  CaseTaskType,
  normalizeCaseTaskTime,
} from '../domain/structures'
import type { DatetimeProvider } from '#shared/interfaces'

type Request = {
  caseId: string
  type: CaseTask['type']
  title: string
  customType?: string
  description: string
  plannedDate: string
  plannedTime?: string
  createdById: string
  assigneeIds?: readonly string[]
  reminders?: readonly CaseTaskReminderCreation[]
  source?: CaseTask['source']
  completionNote?: string
  blocksCaseClosure?: boolean
}

export class CreateCaseTaskUseCase implements UseCase<Request, CaseTask> {
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
    const description = request.description.trim()
    const title = request.title.trim()
    const customType = request.customType?.trim() || undefined
    let assigneeIds = [...new Set(request.assigneeIds ?? [])]
    const now = this.datetimeProvider.now()

    this.validateRequest(request, title, description, customType, assigneeIds, now)
    assertUniqueCaseTaskReminders(request.reminders ?? [])
    const plannedTime = normalizeCaseTaskTime(request.type, request.plannedTime)
    const activeCaseMemberIds = await this.ensureActiveCaseMembers(request.caseId, [
      request.createdById,
      ...assigneeIds,
    ])
    if (request.type !== CaseTaskType.InternalTask) {
      assigneeIds = [...activeCaseMemberIds]
    }

    const creation = this.prepareCreation(request, {
      description,
      title,
      customType,
      plannedTime,
      assigneeIds,
    })
    const createdTask = await this.caseTasksRepository.add(creation)
    await this.appendHistory(createdTask, request.createdById, now)
    return createdTask
  }

  private prepareCreation(
    request: Request,
    values: {
      description: string
      title: string
      customType?: string
      plannedTime?: string
      assigneeIds: readonly string[]
    },
  ): import('../domain/entities').CaseTaskCreation {
    const { description, title, customType, plannedTime, assigneeIds } = values
    return {
      caseId: request.caseId,
      type: request.type,
      title,
      customType,
      description,
      plannedDate: request.plannedDate,
      plannedTime,
      status: CaseTaskStatus.ToDo,
      createdById: request.createdById,
      source: request.source ?? CaseTaskSource.Manual,
      blocksCaseClosure:
        request.type === CaseTaskType.InternalTask && request.blocksCaseClosure === true,
      completionNote: request.completionNote?.trim() || undefined,
      assigneeIds,
      reminders: request.reminders ?? [],
    }
  }

  private async ensureActiveCaseMembers(
    caseId: string,
    collaboratorIds: readonly string[],
  ): Promise<readonly string[]> {
    const uniqueCollaboratorIds = [...new Set(collaboratorIds)]
    const activeAssigneeIds =
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(
        caseId,
        uniqueCollaboratorIds,
      )

    if (!activeAssigneeIds.includes(collaboratorIds[0] ?? '')) {
      throw new ForbiddenError('O usuário não possui acesso a este caso.')
    }

    if (collaboratorIds.slice(1).some((id) => !activeAssigneeIds.includes(id))) {
      throw new BadRequestError(
        'Todos os responsáveis devem pertencer à equipe ativa do caso.',
      )
    }

    return this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(caseId, [])
  }

  private validateRequest(
    request: Request,
    title: string,
    description: string,
    customType: string | undefined,
    assigneeIds: readonly string[],
    now: Date,
  ) {
    if (!title) {
      throw new BadRequestError('O título é obrigatório.')
    }

    if (!description) {
      throw new BadRequestError('A descrição é obrigatória.')
    }

    if (request.type === CaseTaskType.InternalTask && assigneeIds.length === 0) {
      throw new BadRequestError('Informe ao menos um responsável.')
    }

    if (request.type === CaseTaskType.InternalTask && assigneeIds.length > 1) {
      throw new BadRequestError('A tarefa deve ter apenas um responsável.')
    }

    if (request.type === CaseTaskType.Other && !customType) {
      throw new BadRequestError('Informe o tipo personalizado do item.')
    }

    assertValidCaseTaskDate(request.plannedDate, now)
  }

  private async appendHistory(
    task: CaseTask,
    actorId: string,
    now: Date,
    before?: CaseTask,
  ): Promise<void> {
    const isDeadline = task.type === HistoryTaskType.ProcessDeadline
    const kind = isDeadline
      ? CaseHistoryKind.DeadlineCreated
      : CaseHistoryKind.TaskCreated
    await this.histories.add({
      caseId: task.caseId,
      kind,
      category: isDeadline ? CaseHistoryCategory.Deadlines : CaseHistoryCategory.Tasks,
      occurredAt: now,
      recordedAt: now,
      actorId,
      title: isDeadline ? 'Prazo criado' : 'Tarefa criada',
      description: task.title,
      documents: [],
      sourceKey: `task:${task.id}:${task.version}:${kind}`,
      taskChange: {
        before: before ? this.snapshotTask(before) : undefined,
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
