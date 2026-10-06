import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import { CaseTaskSource, CaseTaskStatus, CaseTaskType } from '../../domain/structures'
import type { CaseMembersRepository, CaseTasksRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { CreateCaseTaskUseCase } from '../create-case-task-use-case'

describe('Create Case Task Use Case', () => {
  let caseTasksRepository: MockProxy<CaseTasksRepository>
  let caseMembersRepository: MockProxy<CaseMembersRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>

  function createUseCase() {
    caseTasksRepository = mock<CaseTasksRepository>()
    caseMembersRepository = mock<CaseMembersRepository>()
    datetimeProvider = mock<DatetimeProvider>()
    datetimeProvider.now.mockReturnValue(new Date('2026-10-06T12:00:00.000Z'))
    return new CreateCaseTaskUseCase(
      caseTasksRepository,
      caseMembersRepository,
      datetimeProvider,
    )
  }

  it('creates a task with only active case team members as assignees', async () => {
    const useCase = createUseCase()
    const createdTask = CaseTaskFaker.fake({
      caseId: 'case-1',
      createdById: 'creator-1',
      assigneeIds: ['member-1'],
    })
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['member-1'])
    caseTasksRepository.add.mockResolvedValue(createdTask)

    const result = await useCase.execute({
      caseId: 'case-1',
      type: CaseTaskType.InternalTask,
      description: 'Revisar contestação',
      plannedDate: '2026-10-20',
      createdById: 'creator-1',
      assigneeIds: ['member-1'],
      reminders: [{ daysBefore: 3 }],
    })

    expect(result).toBe(createdTask)
    expect(caseTasksRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'case-1',
        status: CaseTaskStatus.ToDo,
        source: CaseTaskSource.Manual,
        assigneeIds: ['member-1'],
        reminders: [{ daysBefore: 3 }],
      }),
    )
  })

  it('rejects an assignee who is not an active member of the case', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        description: 'Revisar contestação',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: ['outside-member'],
        reminders: [],
      }),
    ).rejects.toThrow('responsáveis devem pertencer à equipe ativa do caso')
    expect(caseTasksRepository.add).not.toHaveBeenCalled()
  })

  it('requires a custom label for the other type and a non-empty description', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.Other,
        description: '  ',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: [],
        reminders: [],
      }),
    ).rejects.toThrow('descrição é obrigatória')
  })
})
