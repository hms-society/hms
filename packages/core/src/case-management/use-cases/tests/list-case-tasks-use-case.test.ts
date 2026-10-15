import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { ForbiddenError } from '#shared/domain/errors'
import { CaseAccessIntent } from '../../domain/structures'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import type { CaseAccessProvider, CaseTasksRepository } from '../../interfaces'
import { ListCaseTasksUseCase } from '../list-case-tasks-use-case'

describe('List Case Tasks Use Case', () => {
  it('lists the non-deleted tasks for a case through the repository contract', async () => {
    const repository: MockProxy<CaseTasksRepository> = mock<CaseTasksRepository>()
    const accessProvider: MockProxy<CaseAccessProvider> = mock<CaseAccessProvider>()
    const tasks = CaseTaskFaker.fakeMany(2).map((task) => ({ ...task, caseId: 'case-1' }))
    repository.listByCaseId.mockResolvedValue(tasks)
    accessProvider.authorize.mockResolvedValue()

    const result = await new ListCaseTasksUseCase(repository, accessProvider).execute({
      caseId: 'case-1',
      actorId: 'actor-1',
    })

    expect(accessProvider.authorize).toHaveBeenCalledWith({
      caseId: 'case-1',
      actorId: 'actor-1',
      intent: CaseAccessIntent.ReadContent,
    })
    expect(result).toEqual(tasks)
    expect(repository.add).not.toHaveBeenCalled()
    expect(repository.replace).not.toHaveBeenCalled()
    expect(repository.remove).not.toHaveBeenCalled()
    expect(repository.listByCaseId).toHaveBeenCalledWith('case-1')
  })

  it('rejects listing tasks when current case read access is denied', async () => {
    const repository: MockProxy<CaseTasksRepository> = mock<CaseTasksRepository>()
    const accessProvider: MockProxy<CaseAccessProvider> = mock<CaseAccessProvider>()
    accessProvider.authorize.mockRejectedValue(new ForbiddenError('Case read denied'))

    await expect(
      new ListCaseTasksUseCase(repository, accessProvider).execute({
        caseId: 'case-1',
        actorId: 'outsider-1',
      }),
    ).rejects.toThrow('Case read denied')
    expect(repository.listByCaseId).not.toHaveBeenCalled()
  })
})
