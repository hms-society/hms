import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { CollaboratorSummaryFaker, UserFaker } from '../../domain/entities/fakers'
import { AuthUserFaker } from '../../domain/structures/fakers'
import type { CollaboratorsRepository, UsersRepository } from '../../interfaces'
import { GetCurrentCollaboratorUseCase } from '../get-current-collaborator-use-case'

describe('Get Current Collaborator Use Case', () => {
  let usersRepository: MockProxy<UsersRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
  })

  it('returns the active collaborator linked to the external identity', async () => {
    const authUser = AuthUserFaker.fake()
    const user = UserFaker.fake({ id: authUser.id, status: 'active' })
    const collaborator = CollaboratorSummaryFaker.legal({
      status: 'active',
    })
    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(collaborator)
    const useCase = new GetCurrentCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
    )

    await expect(useCase.execute({ authUser })).resolves.toBe(collaborator)
    expect(usersRepository.findById).toHaveBeenCalledWith(authUser.id)
    expect(collaboratorsRepository.findSummaryByUserId).toHaveBeenCalledWith(authUser.id)
  })

  it.each([
    ['without an external identity', undefined, undefined],
    ['when the local account is missing', AuthUserFaker.fake(), undefined],
    [
      'when the local account is invited',
      AuthUserFaker.fake(),
      UserFaker.fake({ status: 'invited' }),
    ],
    [
      'when the local account is disabled',
      AuthUserFaker.fake(),
      UserFaker.fake({ status: 'disabled' }),
    ],
  ])('rejects %s without exposing a collaborator', async (_, authUser, user) => {
    if (authUser && user) {
      usersRepository.findById.mockResolvedValue(
        UserFaker.fake({ ...user, id: authUser.id }),
      )
    } else if (authUser) {
      usersRepository.findById.mockResolvedValue(undefined)
    }
    const useCase = new GetCurrentCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
    )

    await expect(useCase.execute({ authUser })).rejects.toThrow('não tem autorização')
    expect(collaboratorsRepository.findSummaryByUserId).not.toHaveBeenCalled()
  })

  it('rejects an active account without a collaborator link', async () => {
    const authUser = AuthUserFaker.fake()
    usersRepository.findById.mockResolvedValue(
      UserFaker.fake({ id: authUser.id, status: 'active' }),
    )
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(undefined)
    const useCase = new GetCurrentCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
    )

    await expect(useCase.execute({ authUser })).rejects.toThrow('não tem autorização')
  })
})
