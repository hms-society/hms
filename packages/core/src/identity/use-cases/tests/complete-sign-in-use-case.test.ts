import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  CollaboratorFaker,
  CollaboratorSummaryFaker,
  UserFaker,
} from '../../domain/entities/fakers'
import { AuthUserFaker } from '../../domain/structures/fakers'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
  IdentityTransaction,
  IdentityTransactionScope,
  UsersRepository,
} from '../../interfaces'
import type { DatetimeProvider } from '#shared/interfaces'
import { CompleteSignInUseCase } from '../complete-sign-in-use-case'

describe('Complete Sign In Use Case', () => {
  let usersRepository: MockProxy<UsersRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let identityTransaction: MockProxy<IdentityTransaction>
  let authAdministrationProvider: MockProxy<AuthAdministrationProvider>
  let transactionScope: IdentityTransactionScope
  let transactionUsersRepository: MockProxy<UsersRepository>
  let transactionCollaboratorsRepository: MockProxy<CollaboratorsRepository>
  let datetimeProvider: MockProxy<DatetimeProvider>
  let useCase: CompleteSignInUseCase

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
    identityTransaction = mock<IdentityTransaction>()
    authAdministrationProvider = mock<AuthAdministrationProvider>()
    transactionUsersRepository = mock<UsersRepository>()
    transactionCollaboratorsRepository = mock<CollaboratorsRepository>()
    transactionScope = {
      usersRepository: transactionUsersRepository,
      collaboratorsRepository: transactionCollaboratorsRepository,
      registrationAttemptsRepository: mock(),
    }
    datetimeProvider = mock<DatetimeProvider>()
    useCase = new CompleteSignInUseCase(
      usersRepository,
      collaboratorsRepository,
      identityTransaction,
      authAdministrationProvider,
      datetimeProvider,
    )
    identityTransaction.run.mockImplementation((operation) => operation(transactionScope))
  })

  it('activates an invited account and records the fixed access time atomically', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    const user = UserFaker.fake({ id: authenticatedUser.id, status: 'invited' })
    const collaborator = CollaboratorFaker.fake({ userId: user.id })
    const summary = CollaboratorSummaryFaker.fake({
      collaboratorId: collaborator.id,
      status: 'active',
    })
    const lastAccessAt = new Date('2026-07-29T15:30:00.000Z')

    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.findById.mockResolvedValue(user)
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.updateStatus.mockResolvedValue(
      UserFaker.fake({ ...user, status: 'active' }),
    )
    transactionUsersRepository.updateLastAccessAt.mockResolvedValue(
      UserFaker.fake({ ...user, status: 'active', lastAccessAt }),
    )
    transactionCollaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)
    datetimeProvider.now.mockReturnValue(lastAccessAt)

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'access-token' }),
    ).resolves.toBe(summary)

    expect(identityTransaction.run).toHaveBeenCalledOnce()
    expect(transactionUsersRepository.updateStatus).toHaveBeenCalledWith(
      user.id,
      'active',
    )
    expect(transactionUsersRepository.updateLastAccessAt).toHaveBeenCalledWith(
      user.id,
      lastAccessAt,
    )
    expect(transactionCollaboratorsRepository.findSummaryByUserId).toHaveBeenCalledWith(
      user.id,
    )
  })

  it('records access for an already active account without changing its status', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    const user = UserFaker.fake({ id: authenticatedUser.id, status: 'active' })
    const collaborator = CollaboratorFaker.fake({ userId: user.id })
    const summary = CollaboratorSummaryFaker.fake({ collaboratorId: collaborator.id })
    const lastAccessAt = new Date('2026-07-29T16:00:00.000Z')

    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.findById.mockResolvedValue(user)
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.updateLastAccessAt.mockResolvedValue(user)
    transactionCollaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)
    datetimeProvider.now.mockReturnValue(lastAccessAt)

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'access-token' }),
    ).resolves.toBe(summary)

    expect(transactionUsersRepository.updateStatus).not.toHaveBeenCalled()
    expect(transactionUsersRepository.updateLastAccessAt).toHaveBeenCalledWith(
      user.id,
      lastAccessAt,
    )
  })

  it('rejects an absent account', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    usersRepository.findById.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'access-token' }),
    ).rejects.toThrow('Usuário não encontrado.')

    expect(collaboratorsRepository.findByUserId).not.toHaveBeenCalled()
    expect(identityTransaction.run).not.toHaveBeenCalled()
    expect(authAdministrationProvider.revokeSession).not.toHaveBeenCalled()
  })

  it('rejects a disabled account', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    usersRepository.findById.mockResolvedValue(
      UserFaker.fake({ id: authenticatedUser.id, status: 'disabled' }),
    )

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'access-token' }),
    ).rejects.toThrow('A conta do usuário está desabilitada.')

    expect(collaboratorsRepository.findByUserId).not.toHaveBeenCalled()
    expect(identityTransaction.run).not.toHaveBeenCalled()
    expect(authAdministrationProvider.revokeSession).not.toHaveBeenCalled()
  })

  it('rejects an account without a collaborator link', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    const user = UserFaker.fake({ id: authenticatedUser.id, status: 'invited' })
    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findByUserId.mockResolvedValue(undefined)

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'access-token' }),
    ).rejects.toThrow('Colaborador não encontrado.')

    expect(identityTransaction.run).not.toHaveBeenCalled()
    expect(authAdministrationProvider.revokeSession).not.toHaveBeenCalled()
  })

  it('revokes the new session when the local transaction fails', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    const user = UserFaker.fake({ id: authenticatedUser.id, status: 'invited' })
    const collaborator = CollaboratorFaker.fake({ userId: user.id })
    const lastAccessAt = new Date('2026-07-29T17:00:00.000Z')

    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.findById.mockResolvedValue(user)
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.updateStatus.mockResolvedValue(user)
    transactionUsersRepository.updateLastAccessAt.mockResolvedValue(undefined)
    datetimeProvider.now.mockReturnValue(lastAccessAt)

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'new-access-token' }),
    ).rejects.toThrow('Usuário não encontrado.')

    expect(transactionCollaboratorsRepository.findSummaryByUserId).not.toHaveBeenCalled()
    expect(authAdministrationProvider.revokeSession).toHaveBeenCalledWith(
      'new-access-token',
    )
  })

  it('does not confirm success when the local transaction commit fails', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    const user = UserFaker.fake({ id: authenticatedUser.id, status: 'invited' })
    const collaborator = CollaboratorFaker.fake({ userId: user.id })
    const summary = CollaboratorSummaryFaker.fake({ collaboratorId: collaborator.id })
    const lastAccessAt = new Date('2026-07-29T17:30:00.000Z')
    const commitError = new Error('local commit failed')

    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.findById.mockResolvedValue(user)
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.updateStatus.mockResolvedValue(
      UserFaker.fake({ ...user, status: 'active' }),
    )
    transactionUsersRepository.updateLastAccessAt.mockResolvedValue(
      UserFaker.fake({ ...user, status: 'active', lastAccessAt }),
    )
    transactionCollaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)
    datetimeProvider.now.mockReturnValue(lastAccessAt)
    identityTransaction.run.mockImplementation(async (operation) => {
      await operation(transactionScope)
      throw commitError
    })

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'new-access-token' }),
    ).rejects.toBe(commitError)

    expect(transactionUsersRepository.updateStatus).toHaveBeenCalledWith(
      user.id,
      'active',
    )
    expect(authAdministrationProvider.revokeSession).toHaveBeenCalledWith(
      'new-access-token',
    )
  })

  it('does not mask the local transaction error when revocation fails', async () => {
    const authenticatedUser = AuthUserFaker.fake()
    const user = UserFaker.fake({ id: authenticatedUser.id, status: 'active' })
    const collaborator = CollaboratorFaker.fake({ userId: user.id })
    const localError = new Error('local commit failed')

    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.findById.mockResolvedValue(user)
    transactionCollaboratorsRepository.findByUserId.mockResolvedValue(collaborator)
    transactionUsersRepository.updateLastAccessAt.mockRejectedValue(localError)
    authAdministrationProvider.revokeSession.mockRejectedValue(
      new Error('session revocation failed'),
    )

    await expect(
      useCase.execute({ authUser: authenticatedUser, accessToken: 'new-access-token' }),
    ).rejects.toBe(localError)

    expect(authAdministrationProvider.revokeSession).toHaveBeenCalledWith(
      'new-access-token',
    )
  })
})
