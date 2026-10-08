import { describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'
import { CaseTaskFaker } from '../../domain/entities/fakers'
import type { CaseMembersRepository, CaseTasksRepository } from '../../interfaces'
import { ListCaseTasksUseCase } from '../list-case-tasks-use-case'

describe('List Case Tasks Use Case', () => {
  it('lists the non-deleted tasks for a case through the repository contract', async () => {
    const repository: MockProxy<CaseTasksRepository> = mock<CaseTasksRepository>()
    const membersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    const tasks = CaseTaskFaker.fakeMany(2).map((task) => ({ ...task, caseId: 'case-1' }))
    repository.listByCaseId.mockResolvedValue(tasks)
    membersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue(['actor-1'])

    const result = await new ListCaseTasksUseCase(repository, membersRepository).execute({
      caseId: 'case-1',
      actorId: 'actor-1',
    })

    expect(result).toEqual(tasks)
    expect(repository.listByCaseId).toHaveBeenCalledWith('case-1')
  })

  it('rejects listing tasks when the actor is not an active case member', async () => {
    const repository: MockProxy<CaseTasksRepository> = mock<CaseTasksRepository>()
    const membersRepository: MockProxy<CaseMembersRepository> =
      mock<CaseMembersRepository>()
    membersRepository.findActiveCollaboratorIdsByCaseId.mockResolvedValue([])

    await expect(
      new ListCaseTasksUseCase(repository, membersRepository).execute({
        caseId: 'case-1',
        actorId: 'outsider-1',
      }),
    ).rejects.toThrow('O usuário não possui acesso a este caso.')
    expect(repository.listByCaseId).not.toHaveBeenCalled()
  })
})
