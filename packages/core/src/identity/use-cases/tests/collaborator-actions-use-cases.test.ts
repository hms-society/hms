import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import {
  CollaboratorFaker,
  CollaboratorSummaryFaker,
  UserFaker,
} from '../../domain/entities/fakers'
import { AuthUserFaker } from '../../domain/structures/fakers'
import type { AuthUser } from '../../domain/structures'
import type {
  AuthAdministrationProvider,
  CollaboratorRegistrationAttemptsRepository,
  CollaboratorsRepository,
  IdentityTransaction,
  UsersRepository,
} from '../../interfaces'
import { CancelCollaboratorInvitationUseCase } from '../cancel-collaborator-invitation-use-case'
import { DeactivateCollaboratorUseCase } from '../deactivate-collaborator-use-case'
import { ReactivateCollaboratorUseCase } from '../reactivate-collaborator-use-case'
import { RemoveCancelledCollaboratorUseCase } from '../remove-cancelled-collaborator-use-case'
import { ResendCollaboratorInvitationUseCase } from '../resend-collaborator-invitation-use-case'

describe('Collaborator action use cases', () => {
  let usersRepository: MockProxy<UsersRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let authAdministrationProvider: MockProxy<AuthAdministrationProvider>
  let authorizeAdministrator: (authUser: AuthUser) => Promise<void>

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
    authAdministrationProvider = mock<AuthAdministrationProvider>()
    authorizeAdministrator = vi.fn(async (_authUser: AuthUser) => undefined)
  })

  it('resends only pending invitations after checking administrative access', async () => {
    const authUser = AuthUserFaker.fake()
    const collaborator = CollaboratorFaker.administrative({ userId: 'invited-user' })
    const user = UserFaker.fake({ id: 'invited-user', status: 'invited' })
    const summary = CollaboratorSummaryFaker.fake({
      collaboratorId: collaborator.id,
      email: user.email,
      status: 'invited',
    })
    collaboratorsRepository.findById.mockResolvedValue(collaborator)
    usersRepository.findById.mockResolvedValue(user)
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)
    authAdministrationProvider.resendInvitation.mockResolvedValue({
      id: user.id,
      email: user.email,
    })

    const useCase = new ResendCollaboratorInvitationUseCase(
      usersRepository,
      collaboratorsRepository,
      authAdministrationProvider,
      authorizeAdministrator,
    )

    await expect(
      useCase.execute({
        authUser,
        collaboratorId: collaborator.id,
        invitationRedirectTo: 'http://localhost:3000/convite',
      }),
    ).resolves.toBe(summary)

    expect(authorizeAdministrator).toHaveBeenCalledWith(authUser)
    expect(authAdministrationProvider.resendInvitation).toHaveBeenCalledWith(
      user.email,
      'http://localhost:3000/convite',
    )
  })

  it('rejects resend for an active collaborator without calling Auth', async () => {
    const collaborator = CollaboratorFaker.administrative({ userId: 'active-user' })
    collaboratorsRepository.findById.mockResolvedValue(collaborator)
    usersRepository.findById.mockResolvedValue(
      UserFaker.fake({ id: 'active-user', status: 'active' }),
    )
    const useCase = new ResendCollaboratorInvitationUseCase(
      usersRepository,
      collaboratorsRepository,
      authAdministrationProvider,
      authorizeAdministrator,
    )

    await expect(
      useCase.execute({
        authUser: AuthUserFaker.fake(),
        collaboratorId: collaborator.id,
      }),
    ).rejects.toThrow('convite pendente')
    expect(authAdministrationProvider.resendInvitation).not.toHaveBeenCalled()
  })

  it('deactivates an active collaborator and returns the refreshed summary', async () => {
    const authUser = AuthUserFaker.fake()
    const collaborator = CollaboratorFaker.administrative({ userId: 'active-user' })
    const user = UserFaker.fake({ id: 'active-user', status: 'active' })
    const disabledUser = UserFaker.fake({ id: user.id, status: 'disabled' })
    const summary = CollaboratorSummaryFaker.fake({
      collaboratorId: collaborator.id,
      status: 'disabled',
    })
    collaboratorsRepository.findById.mockResolvedValue(collaborator)
    usersRepository.findById.mockResolvedValue(user)
    usersRepository.updateStatus.mockResolvedValue(disabledUser)
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)

    const useCase = new DeactivateCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
      authAdministrationProvider,
      authorizeAdministrator,
    )

    await expect(
      useCase.execute({ authUser, collaboratorId: collaborator.id }),
    ).resolves.toBe(summary)
    expect(usersRepository.updateStatus).toHaveBeenCalledWith(user.id, 'disabled')
    expect(authAdministrationProvider.setUserBanned).toHaveBeenCalledWith(user.id, true)
  })

  it('reactivates a disabled collaborator even without a previous access', async () => {
    const collaborator = CollaboratorFaker.administrative({ userId: 'disabled-user' })
    const user = UserFaker.fake({
      id: 'disabled-user',
      status: 'disabled',
      lastAccessAt: undefined,
    })
    const activeUser = UserFaker.fake({ id: user.id, status: 'active' })
    const summary = CollaboratorSummaryFaker.fake({
      collaboratorId: collaborator.id,
      status: 'active',
    })
    collaboratorsRepository.findById.mockResolvedValue(collaborator)
    usersRepository.findById.mockResolvedValue(user)
    usersRepository.updateStatus.mockResolvedValue(activeUser)
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)

    const useCase = new ReactivateCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
      authAdministrationProvider,
      authorizeAdministrator,
    )

    await expect(
      useCase.execute({
        authUser: AuthUserFaker.fake(),
        collaboratorId: collaborator.id,
      }),
    ).resolves.toBe(summary)
    expect(usersRepository.updateStatus).toHaveBeenCalledWith(user.id, 'active')
    expect(authAdministrationProvider.setUserBanned).toHaveBeenCalledWith(user.id, false)
  })

  it('cancels only a pending invitation', async () => {
    const collaborator = CollaboratorFaker.administrative({ userId: 'invited-user' })
    const user = UserFaker.fake({ id: 'invited-user', status: 'invited' })
    const disabledUser = UserFaker.fake({ id: user.id, status: 'disabled' })
    const summary = CollaboratorSummaryFaker.fake({
      collaboratorId: collaborator.id,
      status: 'disabled',
    })
    collaboratorsRepository.findById.mockResolvedValue(collaborator)
    usersRepository.findById.mockResolvedValue(user)
    usersRepository.updateStatus.mockResolvedValue(disabledUser)
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(summary)

    const useCase = new CancelCollaboratorInvitationUseCase(
      usersRepository,
      collaboratorsRepository,
      authorizeAdministrator,
    )

    await expect(
      useCase.execute({
        authUser: AuthUserFaker.fake(),
        collaboratorId: collaborator.id,
      }),
    ).resolves.toBe(summary)
    expect(usersRepository.updateStatus).toHaveBeenCalledWith(user.id, 'disabled')
  })

  it('removes the Auth account and local data for a cancelled invitation', async () => {
    const collaborator = CollaboratorFaker.administrative({ userId: 'cancelled-user' })
    const user = UserFaker.fake({
      id: 'cancelled-user',
      status: 'disabled',
      lastAccessAt: undefined,
    })
    const transactionUsersRepository = mock<UsersRepository>()
    const transactionCollaboratorsRepository = mock<CollaboratorsRepository>()
    const transactionAttemptsRepository =
      mock<CollaboratorRegistrationAttemptsRepository>()
    const identityTransaction = mock<IdentityTransaction>()
    identityTransaction.run.mockImplementation(async (operation) =>
      operation({
        usersRepository: transactionUsersRepository,
        collaboratorsRepository: transactionCollaboratorsRepository,
        registrationAttemptsRepository: transactionAttemptsRepository,
      }),
    )
    collaboratorsRepository.findById.mockResolvedValue(collaborator)
    usersRepository.findById.mockResolvedValue(user)

    const useCase = new RemoveCancelledCollaboratorUseCase(
      usersRepository,
      collaboratorsRepository,
      identityTransaction,
      authAdministrationProvider,
      authorizeAdministrator,
    )

    await expect(
      useCase.execute({
        authUser: AuthUserFaker.fake(),
        collaboratorId: collaborator.id,
      }),
    ).resolves.toBeUndefined()
    expect(authAdministrationProvider.removeUser).toHaveBeenCalledWith(user.id)
    expect(transactionAttemptsRepository.removeByAuthUserId).toHaveBeenCalledWith(user.id)
    expect(transactionCollaboratorsRepository.removeById).toHaveBeenCalledWith(
      collaborator.id,
    )
    expect(transactionUsersRepository.removeById).toHaveBeenCalledWith(user.id)
  })
})
