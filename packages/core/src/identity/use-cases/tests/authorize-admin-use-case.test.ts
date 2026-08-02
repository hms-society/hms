import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { CollaboratorFaker, UserFaker } from '../../domain/entities/fakers'
import { AuthUserFaker } from '../../domain/structures/fakers'
import type { CollaboratorsRepository, UsersRepository } from '../../interfaces'
import { AuthorizeAdminUseCase } from '../authorize-admin-use-case'

describe('Authorize Admin Use Case', () => {
  let usersRepository: MockProxy<UsersRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
  })

  it('authorizes an active account linked to an admin collaborator', async () => {
    const authUser = AuthUserFaker.fake()
    usersRepository.findById.mockResolvedValue(
      UserFaker.fake({ id: authUser.id, status: 'active' }),
    )
    collaboratorsRepository.findByUserId.mockResolvedValue(
      CollaboratorFaker.administrative({ profile: 'admin' }),
    )
    const useCase = new AuthorizeAdminUseCase(usersRepository, collaboratorsRepository)

    await expect(useCase.execute({ authUser })).resolves.toBeUndefined()
  })

  it.each([
    ['an invited account', 'invited', 'admin'],
    ['a disabled account', 'disabled', 'admin'],
    ['a non-admin collaborator', 'active', 'attendant'],
  ])('rejects %s without leaking administrative data', async (_, status, profile) => {
    const authUser = AuthUserFaker.fake()
    usersRepository.findById.mockResolvedValue(
      UserFaker.fake({
        id: authUser.id,
        status: status as 'active' | 'invited' | 'disabled',
      }),
    )
    collaboratorsRepository.findByUserId.mockResolvedValue(
      CollaboratorFaker.administrative({ profile: profile as 'admin' | 'attendant' }),
    )
    const useCase = new AuthorizeAdminUseCase(usersRepository, collaboratorsRepository)

    await expect(useCase.execute({ authUser })).rejects.toThrow('não tem autorização')
  })
})
