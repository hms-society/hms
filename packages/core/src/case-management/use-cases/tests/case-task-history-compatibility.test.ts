import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import { CaseTaskType } from '../../domain/structures'
import type { CaseMembersRepository, CaseTasksRepository } from '../../interfaces'
import type { DatetimeProvider } from '../../../shared/interfaces'
import { CreateCaseTaskUseCase } from '../create-case-task-use-case'
import { DeleteCaseTaskUseCase } from '../delete-case-task-use-case'
import { UpdateCaseTaskUseCase } from '../update-case-task-use-case'

describe('Case task history compatibility', () => {
  function setup() {
    const tasks: MockProxy<CaseTasksRepository> = mock<CaseTasksRepository>()
    const members: MockProxy<CaseMembersRepository> = mock<CaseMembersRepository>()
    const datetime: MockProxy<DatetimeProvider> = mock<DatetimeProvider>()
    const task = CaseTaskFaker.fake({ caseId: 'case-1', version: 1 })

    tasks.findById.mockResolvedValue(task)
    tasks.add.mockResolvedValue(task)
    tasks.replace.mockResolvedValue(task)
    tasks.remove.mockResolvedValue(task)
    members.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['actor-1'])
    datetime.now.mockReturnValue(new Date('2026-10-06T12:00:00.000Z'))

    return { tasks, members, datetime, task }
  }

  it('keeps task creation working for callers before history adapters are wired', async () => {
    const { tasks, members, datetime, task } = setup()

    const result = await new CreateCaseTaskUseCase(tasks, members, datetime).execute({
      caseId: 'case-1',
      type: CaseTaskType.InternalTask,
      title: 'Revisar petição',
      description: 'Revisar petição',
      plannedDate: '2026-10-20',
      createdById: 'actor-1',
      assigneeIds: ['actor-1'],
    })

    expect(result).toBe(task)
    expect(tasks.add).toHaveBeenCalledOnce()
  })

  it('keeps task updates working for callers before history adapters are wired', async () => {
    const { tasks, members, datetime, task } = setup()

    const result = await new UpdateCaseTaskUseCase(tasks, members, datetime).execute({
      caseId: 'case-1',
      caseTaskId: task.id,
      actorId: 'actor-1',
      version: task.version,
      title: 'Revisar petição atualizada',
    })

    expect(result).toBe(task)
    expect(tasks.replace).toHaveBeenCalledOnce()
  })

  it('keeps task deletion working for callers before history adapters are wired', async () => {
    const { tasks, members, datetime, task } = setup()

    const result = await new DeleteCaseTaskUseCase(tasks, members, datetime).execute({
      caseId: 'case-1',
      caseTaskId: task.id,
      actorId: 'actor-1',
      version: task.version,
    })

    expect(result).toBe(task)
    expect(tasks.remove).toHaveBeenCalledOnce()
  })
})
