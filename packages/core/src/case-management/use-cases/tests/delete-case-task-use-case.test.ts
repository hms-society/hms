import { ConflictError as HistoryConflictError } from '#shared/domain/errors'
import { CaseHistoryKind } from '../../domain/structures'
import type {
  CaseHistoriesRepository,
  CaseHistoryTransactionProvider,
} from '../../interfaces'
import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import type { CaseMembersRepository, CaseTasksRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { CaseTaskStatus, CaseTaskType } from '../../domain/structures'
import { DeleteCaseTaskUseCase } from '../delete-case-task-use-case'

describe('Delete Case Task Use Case', () => {
  it('soft deletes a task with the expected version', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const membersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const now = new Date('2026-10-06T12:00:00.000Z')
    const task = CaseTaskFaker.fake({ caseId: 'case-1', version: 4 })
    const deletedTask = CaseTaskFaker.fake({ ...task, deletedAt: now, version: 5 })
    datetimeProvider.now.mockReturnValue(now)
    caseTasksRepository.findById.mockResolvedValue(task)
    caseTasksRepository.remove.mockResolvedValue(deletedTask)
    membersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['actor-1'])

    const result = await new DeleteCaseTaskUseCase(
      caseTasksRepository,
      membersRepository,
      datetimeProvider,
      histories,
      transaction,
    ).execute({ caseId: 'case-1', caseTaskId: task.id, actorId: 'actor-1', version: 4 })

    expect(result).toBe(deletedTask)
    expect(caseTasksRepository.remove).toHaveBeenCalledWith(task.id, 4, now, now)
  })

  it('rejects deleting a completed task', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const membersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const task = CaseTaskFaker.fake({
      caseId: 'case-1',
      status: CaseTaskStatus.Completed,
      version: 4,
    })
    caseTasksRepository.findById.mockResolvedValue(task)
    membersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['actor-1'])

    await expect(
      new DeleteCaseTaskUseCase(
        caseTasksRepository,
        membersRepository,
        datetimeProvider,
        histories,
        transaction,
      ).execute({
        caseId: 'case-1',
        caseTaskId: task.id,
        actorId: 'actor-1',
        version: task.version,
      }),
    ).rejects.toThrow('Tarefas concluídas não podem ser excluídas.')
    expect(caseTasksRepository.remove).not.toHaveBeenCalled()
  })

  it('rejects deleting a task when the actor is not an active case member', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const membersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const task = CaseTaskFaker.fake({ caseId: 'case-1', version: 4 })
    caseTasksRepository.findById.mockResolvedValue(task)
    membersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      new DeleteCaseTaskUseCase(
        caseTasksRepository,
        membersRepository,
        datetimeProvider,
        histories,
        transaction,
      ).execute({
        caseId: 'case-1',
        caseTaskId: task.id,
        actorId: 'outsider-1',
        version: task.version,
      }),
    ).rejects.toThrow('O usuário não possui acesso a este caso.')
    expect(caseTasksRepository.remove).not.toHaveBeenCalled()
  })
  it('appends a detached immutable snapshot within the transaction and propagates append failure', async () => {
    const tasks = mock<CaseTasksRepository>()
    const members = mock<CaseMembersRepository>()
    const datetime = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    const now = new Date('2026-10-06T12:00:00.000Z')
    datetime.now.mockReturnValue(now)
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const before = CaseTaskFaker.fake({
      caseId: 'case-1',
      type: CaseTaskType.ProcessDeadline,
      createdById: 'actor',
      version: 1,
      reminders: [{ id: 'reminder-1', value: 2, unit: 'days', createdAt: now }],
    })
    const after = { ...before, version: 2 }
    members.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['actor'])
    tasks.findById.mockResolvedValue(before)
    tasks.add.mockResolvedValue(after)
    tasks.replace.mockResolvedValue(after)
    tasks.remove.mockResolvedValue(after)
    const useCase = new DeleteCaseTaskUseCase(
      tasks,
      members,
      datetime,
      histories,
      transaction,
    )

    const request = {
      caseId: 'case-1',
      caseTaskId: before.id,
      actorId: 'actor',
      version: 1,
    }
    expect(await useCase.execute(request)).toBe(after)
    expect(transaction.runInTransaction).toHaveBeenCalledTimes(1)
    expect(histories.add).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: CaseHistoryKind.DeadlineCancelled,
        title: 'Prazo cancelado',
        actorId: 'actor',
        occurredAt: now,
        recordedAt: now,
        documents: [],
      }),
    )
    const snapshot = histories.add.mock.calls[0]?.[0].taskChange
    expect(snapshot?.after.taskId).toBe(after.id)
    expect(snapshot?.after.assigneeIds).not.toBe(after.assigneeIds)
    expect(snapshot?.after.reminders).not.toBe(after.reminders)
    expect(snapshot?.after.reminders).toEqual([{ value: 2, unit: 'days' }])
    expect(snapshot?.after.reminders[0]).not.toBe(after.reminders[0])
    expect(snapshot?.before?.version).toBe(1)
    histories.add.mockRejectedValue(new HistoryConflictError('Append failed'))
    await expect(useCase.execute(request)).rejects.toThrow(HistoryConflictError)
  })
})
