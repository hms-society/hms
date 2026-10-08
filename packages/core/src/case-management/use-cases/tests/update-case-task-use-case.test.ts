import { describe, expect, it } from 'vitest'
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
})
