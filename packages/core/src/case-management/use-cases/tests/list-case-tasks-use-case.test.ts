import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import type { CaseTasksRepository } from '../../interfaces'
import { ListCaseTasksUseCase } from '../list-case-tasks-use-case'

describe('List Case Tasks Use Case', () => {
  it('lists the non-deleted tasks for a case through the repository contract', async () => {
    const repository: MockProxy<CaseTasksRepository> = mock<CaseTasksRepository>()
    const tasks = CaseTaskFaker.fakeMany(2).map((task) => ({ ...task, caseId: 'case-1' }))
    repository.listByCaseId.mockResolvedValue(tasks)

    const result = await new ListCaseTasksUseCase(repository).execute('case-1')

    expect(result).toEqual(tasks)
    expect(repository.listByCaseId).toHaveBeenCalledWith('case-1')
  })
})
