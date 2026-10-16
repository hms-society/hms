import { ConflictError as HistoryConflictError } from '#shared/domain/errors'
import { CaseHistoryKind } from '../../domain/structures'
import type {
  CaseHistoriesRepository,
  CaseHistoryTransactionProvider,
} from '../../interfaces'
import { beforeEach, describe, expect, it } from 'vitest'
import type { CaseTask, CaseTaskUpdate } from '../../domain/entities'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import { CaseTaskStatus, CaseTaskType } from '../../domain/structures'
import type { CaseMembersRepository, CaseTasksRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { UpdateCaseTaskUseCase } from '../update-case-task-use-case'

describe('Update Case Task Use Case', () => {
  it('updates status and assignees using the expected version', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const caseMembersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const now = new Date('2026-10-06T12:00:00.000Z')
    const currentTask = CaseTaskFaker.fake({ caseId: 'case-1', version: 2 })
    const updatedTask = CaseTaskFaker.fake({
      ...currentTask,
      status: CaseTaskStatus.Completed,
      version: 3,
      completedAt: now,
      completedById: 'collaborator-1',
    })
    datetimeProvider.now.mockReturnValue(now)
    caseTasksRepository.findById.mockResolvedValue(currentTask)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId
      .mockResolvedValueOnce(['collaborator-1'])
      .mockResolvedValueOnce(['member-1'])
    caseTasksRepository.replace.mockResolvedValue(updatedTask)

    const result = await new UpdateCaseTaskUseCase(
      caseTasksRepository,
      caseMembersRepository,
      datetimeProvider,
      histories,
      transaction,
    ).execute({
      caseId: 'case-1',
      caseTaskId: currentTask.id,
      actorId: 'collaborator-1',
      version: 2,
      status: CaseTaskStatus.Completed,
      assigneeIds: ['member-1'],
    })

    expect(result).toBe(updatedTask)
    expect(caseTasksRepository.replace).toHaveBeenCalledWith(
      currentTask.id,
      expect.objectContaining({
        status: CaseTaskStatus.Completed,
        assigneeIds: ['member-1'],
        completedAt: now,
        completedById: 'collaborator-1',
      }),
      2,
      now,
    )
  })

  it('rejects a stale version when the repository cannot replace the record', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const caseMembersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    caseTasksRepository.findById.mockResolvedValue(
      CaseTaskFaker.fake({ caseId: 'case-1', version: 2 }),
    )
    caseTasksRepository.replace.mockResolvedValue(undefined)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'collaborator-1',
    ])

    await expect(
      new UpdateCaseTaskUseCase(
        caseTasksRepository,
        caseMembersRepository,
        datetimeProvider,
        histories,
        transaction,
      ).execute({
        caseId: 'case-1',
        caseTaskId: 'task-1',
        actorId: 'collaborator-1',
        version: 1,
        description: 'Atualização concorrente',
      }),
    ).rejects.toThrow('foi alterada por outra pessoa')
  })

  it('rejects assigning more than one responsible', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const caseMembersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const currentTask = CaseTaskFaker.fake({ caseId: 'case-1', version: 2 })
    caseTasksRepository.findById.mockResolvedValue(currentTask)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'collaborator-1',
    ])

    await expect(
      new UpdateCaseTaskUseCase(
        caseTasksRepository,
        caseMembersRepository,
        datetimeProvider,
        histories,
        transaction,
      ).execute({
        caseId: 'case-1',
        caseTaskId: currentTask.id,
        actorId: 'collaborator-1',
        version: currentTask.version,
        assigneeIds: ['member-1', 'member-2'],
      }),
    ).rejects.toThrow('apenas um responsável')
  })

  it('rejects closure blocking for non-internal task types', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const caseMembersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const currentTask = CaseTaskFaker.fake({
      caseId: 'case-1',
      type: CaseTaskType.Publication,
    })
    caseTasksRepository.findById.mockResolvedValue(currentTask)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'collaborator-1',
    ])

    await expect(
      new UpdateCaseTaskUseCase(
        caseTasksRepository,
        caseMembersRepository,
        datetimeProvider,
        histories,
        transaction,
      ).execute({
        caseId: 'case-1',
        caseTaskId: currentTask.id,
        actorId: 'collaborator-1',
        version: currentTask.version,
        blocksCaseClosure: true,
      }),
    ).rejects.toThrow('Somente tarefas internas')
  })

  it('rejects edits to a completed task', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const caseMembersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const currentTask = CaseTaskFaker.fake({
      caseId: 'case-1',
      status: CaseTaskStatus.Completed,
    })
    caseTasksRepository.findById.mockResolvedValue(currentTask)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'collaborator-1',
    ])

    await expect(
      new UpdateCaseTaskUseCase(
        caseTasksRepository,
        caseMembersRepository,
        datetimeProvider,
        histories,
        transaction,
      ).execute({
        caseId: 'case-1',
        caseTaskId: currentTask.id,
        actorId: 'collaborator-1',
        version: currentTask.version,
        description: 'Tentativa de alteração',
      }),
    ).rejects.toThrow('Tarefas concluídas não podem ser editadas.')
    expect(caseTasksRepository.replace).not.toHaveBeenCalled()
  })

  it('rejects duplicate reminders before persistence', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const caseMembersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const histories = mock<CaseHistoriesRepository>()
    const transaction = mock<CaseHistoryTransactionProvider>()
    transaction.runInTransaction.mockImplementation((callback) => callback())
    const currentTask = CaseTaskFaker.fake({ caseId: 'case-1', version: 2 })
    caseTasksRepository.findById.mockResolvedValue(currentTask)
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'collaborator-1',
    ])

    await expect(
      new UpdateCaseTaskUseCase(
        caseTasksRepository,
        caseMembersRepository,
        datetimeProvider,
        histories,
        transaction,
      ).execute({
        caseId: 'case-1',
        caseTaskId: currentTask.id,
        actorId: 'collaborator-1',
        version: currentTask.version,
        reminders: [
          { value: 3, unit: 'days' },
          { value: 3, unit: 'days' },
        ],
      }),
    ).rejects.toThrow('Não é permitido repetir o mesmo lembrete.')
    expect(caseTasksRepository.replace).not.toHaveBeenCalled()
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
      reminders: [],
    })
    const after = { ...before, version: 2 }
    members.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['actor'])
    tasks.findById.mockResolvedValue(before)
    tasks.add.mockResolvedValue(after)
    tasks.replace.mockResolvedValue(after)
    tasks.remove.mockResolvedValue(after)
    const useCase = new UpdateCaseTaskUseCase(
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
      plannedDate: '2026-10-20',
    }
    expect(await useCase.execute(request)).toBe(after)
    expect(transaction.runInTransaction).toHaveBeenCalledTimes(1)
    expect(histories.add).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: CaseHistoryKind.DeadlineUpdated,
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
    expect(snapshot?.before?.version).toBe(1)
    histories.add.mockRejectedValue(new HistoryConflictError('Append failed'))
    await expect(useCase.execute(request)).rejects.toThrow(HistoryConflictError)
  })
})

describe('Task history records successful outcomes and rejects invalid changes', () => {
  const tasks = mock<CaseTasksRepository>()
  const members = mock<CaseMembersRepository>()
  const datetime = mock<DatetimeProvider>()
  const histories = mock<CaseHistoriesRepository>()
  const transaction = mock<CaseHistoryTransactionProvider>()
  const now = new Date('2026-10-06T12:00:00Z')
  let current: CaseTask
  const useCase = new UpdateCaseTaskUseCase(
    tasks,
    members,
    datetime,
    histories,
    transaction,
  )
  beforeEach(() => {
    tasks.findById.mockReset()
    tasks.replace.mockReset()
    members.findActiveCollaboratorIdsByCaseId.mockReset()
    histories.add.mockReset()
    current = CaseTaskFaker.fake({
      caseId: 'case-1',
      type: CaseTaskType.InternalTask,
      status: CaseTaskStatus.ToDo,
      blocksCaseClosure: false,
      version: 1,
      reminders: [],
      plannedDate: '2026-10-20',
      plannedTime: undefined,
    })
    datetime.now.mockReturnValue(now)
    tasks.findById.mockResolvedValue(current)
    members.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['actor'])
    tasks.replace.mockImplementation(
      async (_id, changes) =>
        ({
          ...current,
          ...Object.fromEntries(
            Object.entries(changes).filter(([, value]) => value !== undefined),
          ),
          version: 2,
        }) as CaseTask,
    )
    transaction.runInTransaction.mockImplementation((callback) => callback())
  })
  function execute(changes: CaseTaskUpdate = {}) {
    return useCase.execute({
      caseId: 'case-1',
      caseTaskId: current.id,
      actorId: 'actor',
      version: 1,
      ...changes,
    })
  }
  it.each([
    { title: ' ' },
    { description: ' ' },
  ])('rejects blank content %j without a write', async (changes) => {
    await expect(execute(changes)).rejects.toThrow('obrigatóri')
    expect(tasks.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it.each(['missing', 'foreign'])('rejects %s task without a write', async (mode) => {
    tasks.findById.mockResolvedValue(
      mode === 'missing' ? undefined : { ...current, caseId: 'another-case' },
    )
    await expect(execute()).rejects.toThrow('não encontrado')
    expect(tasks.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('denies an inactive or removed actor without a write', async () => {
    members.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])
    await expect(execute()).rejects.toThrow('não possui acesso')
    expect(tasks.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('requires a custom type when changing to Other', async () => {
    await expect(execute({ type: CaseTaskType.Other, customType: ' ' })).rejects.toThrow(
      'tipo personalizado',
    )
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('rejects changing a closure-blocking task to a collective type', async () => {
    tasks.findById.mockResolvedValue({ ...current, blocksCaseClosure: true })
    await expect(execute({ type: CaseTaskType.Publication })).rejects.toThrow(
      'Somente tarefas internas',
    )
    expect(tasks.replace).not.toHaveBeenCalled()
  })
  it.each([
    { assigneeIds: [] },
    { assigneeIds: ['foreign'] },
  ])('rejects unavailable responsible set %j', async ({ assigneeIds }) => {
    members.findActiveCollaboratorIdsByCaseId
      .mockResolvedValueOnce(['actor'])
      .mockResolvedValueOnce([])
    await expect(execute({ assigneeIds })).rejects.toThrow()
    expect(tasks.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it.each([
    '2020-01-01',
    '2026-02-30',
  ])('rejects invalid planned date %s', async (plannedDate) => {
    await expect(execute({ plannedDate })).rejects.toThrow()
    expect(tasks.replace).not.toHaveBeenCalled()
    expect(histories.add).not.toHaveBeenCalled()
  })
  it('preserves exact normalized content, reassignment and reminder snapshots', async () => {
    const result = await execute({
      title: ' Nova tarefa ',
      description: ' Conteúdo atualizado ',
      plannedDate: '2026-10-21',
      assigneeIds: ['actor', 'actor'],
      reminders: [{ value: 2, unit: 'days' }],
      status: CaseTaskStatus.InProgress,
      blocksCaseClosure: true,
      completionNote: 'Observação',
    })
    expect(tasks.replace).toHaveBeenCalledWith(
      current.id,
      expect.objectContaining({
        title: 'Nova tarefa',
        description: 'Conteúdo atualizado',
        assigneeIds: ['actor'],
        completedAt: null,
        completedById: null,
      }),
      1,
      now,
    )
    expect(histories.add).toHaveBeenCalledWith(
      expect.objectContaining({
        kind: CaseHistoryKind.TaskUpdated,
        title: 'Tarefa atualizada',
        taskChange: expect.objectContaining({
          before: expect.objectContaining({ title: current.title, reminders: [] }),
          after: expect.objectContaining({
            title: 'Nova tarefa',
            description: 'Conteúdo atualizado',
            reminders: [{ value: 2, unit: 'days' }],
            blocksCaseClosure: true,
            completionNote: 'Observação',
            assigneeIds: ['actor'],
          }),
        }),
      }),
    )
    expect(result.status).toBe(CaseTaskStatus.InProgress)
  })
  it.each([
    [
      CaseTaskType.InternalTask,
      CaseTaskStatus.Completed,
      CaseHistoryKind.TaskCompleted,
      'Tarefa concluída',
    ],
    [
      CaseTaskType.ProcessDeadline,
      CaseTaskStatus.Completed,
      CaseHistoryKind.DeadlineCompleted,
      'Prazo concluído',
    ],
    [
      CaseTaskType.ProcessDeadline,
      CaseTaskStatus.InProgress,
      CaseHistoryKind.DeadlineUpdated,
      'Prazo atualizado',
    ],
  ] as const)('labels %s %s as a factual outcome', async (type, status, kind, title) => {
    await execute({ type, status, plannedTime: '14:30' })
    expect(histories.add).toHaveBeenCalledWith(
      expect.objectContaining({
        kind,
        title,
        taskChange: expect.objectContaining({
          after: expect.objectContaining({
            type,
            status,
            ...(status === CaseTaskStatus.Completed
              ? { completedAt: now.toISOString(), completedById: 'actor' }
              : {}),
          }),
        }),
      }),
    )
  })
  it('keeps custom-type and unchanged schedule in a type-change snapshot', async () => {
    current = {
      ...current,
      type: CaseTaskType.Other,
      customType: 'Recursal',
      plannedTime: '15:00',
    }
    tasks.findById.mockResolvedValue(current)
    await execute({ type: CaseTaskType.Other, customType: undefined })
    expect(histories.add).toHaveBeenCalledWith(
      expect.objectContaining({
        taskChange: expect.objectContaining({
          before: expect.objectContaining({ customType: 'Recursal' }),
          after: expect.objectContaining({
            type: CaseTaskType.Other,
            customType: 'Recursal',
            plannedTime: '15:00:00',
          }),
        }),
      }),
    )
  })
})
