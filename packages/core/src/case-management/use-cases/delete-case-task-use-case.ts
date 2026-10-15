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
import { CaseTaskStatus } from '../domain/structures'
import type { CaseTask } from '../domain/entities'
import type { CaseMembersRepository, CaseTasksRepository } from '../interfaces'
import type { DatetimeProvider } from '#shared/interfaces'

type Request = {
  caseId: string
  caseTaskId: string
  actorId: string
  version: number
}

export class DeleteCaseTaskUseCase implements UseCase<Request, CaseTask> {
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
    const currentTask = await this.caseTasksRepository.findById(request.caseTaskId)
    if (!currentTask || currentTask.caseId !== request.caseId) {
      throw new NotFoundError('Tarefa ou prazo não encontrado.')
    }
    const activeMembers =
      await this.caseMembersRepository.findActiveCollaboratorIdsByCaseId(request.caseId, [
        request.actorId,
      ])
    if (activeMembers.length !== 1) {
      throw new ForbiddenError('O usuário não possui acesso a este caso.')
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

    await this.appendHistory(deletedTask, request.actorId, now, currentTask)
    return deletedTask
  }

  private async appendHistory(
    task: CaseTask,
    actorId: string,
    now: Date,
    before: CaseTask,
  ): Promise<void> {
    const isDeadline = task.type === HistoryTaskType.ProcessDeadline
    const kind = isDeadline
      ? CaseHistoryKind.DeadlineCancelled
      : CaseHistoryKind.TaskDeleted
    await this.histories.add({
      caseId: task.caseId,
      kind,
      category: isDeadline ? CaseHistoryCategory.Deadlines : CaseHistoryCategory.Tasks,
      occurredAt: now,
      recordedAt: now,
      actorId,
      title: isDeadline ? 'Prazo cancelado' : 'Tarefa excluída',
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
