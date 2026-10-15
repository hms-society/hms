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
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'creator-1',
      'member-1',
    ])
    caseTasksRepository.add.mockResolvedValue(createdTask)

    const result = await useCase.execute({
      caseId: 'case-1',
      type: CaseTaskType.InternalTask,
      title: 'Revisar contestação',
      description: 'Revisar contestação',
      plannedDate: '2026-10-20',
      createdById: 'creator-1',
      assigneeIds: ['member-1'],
      reminders: [{ value: 3, unit: 'days' }],
    })

    expect(result).toBe(createdTask)
    expect(caseTasksRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        caseId: 'case-1',
        status: CaseTaskStatus.ToDo,
        source: CaseTaskSource.Manual,
        assigneeIds: ['member-1'],
        reminders: [{ value: 3, unit: 'days' }],
      }),
    )
  })

  it('assigns dated events to every active case member', async () => {
    const useCase = createUseCase()
    const createdTask = CaseTaskFaker.fake({
      caseId: 'case-1',
      type: CaseTaskType.Hearing,
      createdById: 'creator-1',
      assigneeIds: ['creator-1', 'member-1', 'member-2'],
    })
    caseMembersRepository.findActiveCollaboratorIdsByCaseId
      .mockResolvedValueOnce(['creator-1'])
      .mockResolvedValueOnce(['creator-1', 'member-1', 'member-2'])
    caseTasksRepository.add.mockResolvedValue(createdTask)

    await useCase.execute({
      caseId: 'case-1',
      type: CaseTaskType.Hearing,
      title: 'Audiência de instrução',
      description: 'Participação da equipe na audiência',
      plannedDate: '2026-10-20',
      plannedTime: '10:00',
      createdById: 'creator-1',
      reminders: [],
    })

    expect(caseTasksRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({
        assigneeIds: ['creator-1', 'member-1', 'member-2'],
      }),
    )
  })

  it('rejects an assignee who is not an active member of the case', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'creator-1',
    ])

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        title: 'Revisar contestação',
        description: 'Revisar contestação',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: ['outside-member'],
        reminders: [],
      }),
    ).rejects.toThrow('responsáveis devem pertencer à equipe ativa do caso')
    expect(caseTasksRepository.add).not.toHaveBeenCalled()
  })

  it('rejects duplicate reminders before persistence', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'creator-1',
      'member-1',
    ])

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        title: 'Lembretes duplicados',
        description: 'Não deve persistir lembretes duplicados',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: ['member-1'],
        reminders: [
          { value: 3, unit: 'days' },
          { value: 3, unit: 'days' },
        ],
      }),
    ).rejects.toThrow('Não é permitido repetir o mesmo lembrete.')
    expect(caseTasksRepository.add).not.toHaveBeenCalled()
  })

  it('rejects creating a task when the creator is not an active case member', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'creator-1',
      'member-1',
    ])

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        title: 'Revisar contestação',
        description: 'Revisar contestação',
        plannedDate: '2026-10-20',
        createdById: 'outsider-1',
        assigneeIds: ['member-1'],
        reminders: [],
      }),
    ).rejects.toThrow('O usuário não possui acesso a este caso.')
    expect(caseTasksRepository.add).not.toHaveBeenCalled()
  })

  it('requires a custom label for the other type and a non-empty description', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'creator-1',
      'member-1',
    ])

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.Other,
        title: 'Outro item',
        description: '  ',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: ['member-1'],
        reminders: [],
      }),
    ).rejects.toThrow('descrição é obrigatória')
  })

  it('requires a non-empty title and at least one responsible', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        title: '  ',
        description: 'Descrição válida',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: [],
        reminders: [],
      }),
    ).rejects.toThrow('título é obrigatório')

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        title: 'Tarefa válida',
        description: 'Descrição válida',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: [],
        reminders: [],
      }),
    ).rejects.toThrow('responsável')
  })

  it('rejects more than one responsible', async () => {
    const useCase = createUseCase()

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        title: 'Tarefa válida',
        description: 'Descrição válida',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: ['member-1', 'member-2'],
        reminders: [],
      }),
    ).rejects.toThrow('apenas um responsável')
  })

  it('applies type-specific temporal rules', async () => {
    const useCase = createUseCase()
    caseMembersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([
      'creator-1',
      'member-1',
    ])
    caseTasksRepository.add.mockResolvedValue(CaseTaskFaker.fake())

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.Hearing,
        title: 'Audiência',
        description: 'Audiência do caso',
        plannedDate: '2026-10-20',
        createdById: 'creator-1',
        assigneeIds: ['member-1'],
        reminders: [],
      }),
    ).rejects.toThrow('exigem horário')

    await expect(
      useCase.execute({
        caseId: 'case-1',
        type: CaseTaskType.InternalTask,
        title: 'Tarefa',
        description: 'Data inválida',
        plannedDate: '2026-02-31',
        createdById: 'creator-1',
        assigneeIds: ['member-1'],
        reminders: [],
      }),
    ).rejects.toThrow('data prevista é inválida')
  })
})
