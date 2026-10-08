import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import type { CaseTasksRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { CaseTaskStatus } from '../../domain/structures'
import { DeleteCaseTaskUseCase } from '../delete-case-task-use-case'

describe('Delete Case Task Use Case', () => {
  it('soft deletes a task with the expected version', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const now = new Date('2026-10-06T12:00:00.000Z')
    const task = CaseTaskFaker.fake({ caseId: 'case-1', version: 4 })
    const deletedTask = CaseTaskFaker.fake({ ...task, deletedAt: now, version: 5 })
    datetimeProvider.now.mockReturnValue(now)
    caseTasksRepository.findById.mockResolvedValue(task)
    caseTasksRepository.remove.mockResolvedValue(deletedTask)

    const result = await new DeleteCaseTaskUseCase(
      caseTasksRepository,
      datetimeProvider,
    ).execute({ caseId: 'case-1', caseTaskId: task.id, version: 4 })

    expect(result).toBe(deletedTask)
    expect(caseTasksRepository.remove).toHaveBeenCalledWith(task.id, 4, now, now)
  })

  it('rejects deleting a completed task', async () => {
    const caseTasksRepository: MockProxy<CaseTasksRepository> =
      mock<CaseTasksRepository>()
    const datetimeProvider: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const task = CaseTaskFaker.fake({
      caseId: 'case-1',
      status: CaseTaskStatus.Completed,
      version: 4,
    })
    caseTasksRepository.findById.mockResolvedValue(task)

    await expect(
      new DeleteCaseTaskUseCase(caseTasksRepository, datetimeProvider).execute({
        caseId: 'case-1',
        caseTaskId: task.id,
        version: task.version,
      }),
    ).rejects.toThrow('Tarefas concluídas não podem ser excluídas.')
    expect(caseTasksRepository.remove).not.toHaveBeenCalled()
  })
})
