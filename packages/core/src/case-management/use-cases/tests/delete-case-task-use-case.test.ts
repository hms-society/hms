import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import type { CaseMembersRepository, CaseTasksRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { CaseTaskStatus } from '../../domain/structures'
import { DeleteCaseTaskUseCase } from '../delete-case-task-use-case'

describe('Delete Case Task Use Case', () => {
  it('soft deletes a task with the expected version', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
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
    ).execute({ caseId: 'case-1', caseTaskId: task.id, actorId: 'actor-1', version: 4 })

    expect(result).toBe(deletedTask)
    expect(caseTasksRepository.remove).toHaveBeenCalledWith(task.id, 4, now, now)
  })

  it('rejects deleting a completed task', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
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
    const task = CaseTaskFaker.fake({ caseId: 'case-1', version: 4 })
    caseTasksRepository.findById.mockResolvedValue(task)
    membersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      new DeleteCaseTaskUseCase(
        caseTasksRepository,
        membersRepository,
        datetimeProvider,
      ).execute({
        caseId: 'case-1',
        caseTaskId: task.id,
        actorId: 'outsider-1',
        version: task.version,
      }),
    ).rejects.toThrow('O usuário não possui acesso a este caso.')
    expect(caseTasksRepository.remove).not.toHaveBeenCalled()
  })
})
