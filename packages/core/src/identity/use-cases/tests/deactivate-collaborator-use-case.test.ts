import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { EnsureCaseManagerContinuityUseCase } from '@hms/core/case-management/use-cases'
import type { CaseIdentityTransaction, IdProvider } from '#shared/interfaces'
import type { CaseIdentityTransactionScope } from '#shared/interfaces/case-identity-transaction-scope'
import { CollaboratorSummaryFaker } from '../../domain/entities/fakers'
import {
  CollaboratorNotAuthorizedError,
  CollaboratorNotFoundError,
  UserNotFoundError,
} from '../../domain/errors'
import type { AuthUser } from '../../domain/structures'
import type { Collaborator } from '../../domain/entities'
import type {
  AuthAdministrationProvider,
  CollaboratorsRepository,
} from '../../interfaces'
import type { UsersRepository } from '../../interfaces/users-repository'
import { DeactivateCollaboratorUseCase } from '../deactivate-collaborator-use-case'

describe('DeactivateCollaboratorUseCase', () => {
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let authAdministrationProvider: MockProxy<AuthAdministrationProvider>
  let caseIdentityTransaction: MockProxy<CaseIdentityTransaction>
  let ensureContinuity: MockProxy<EnsureCaseManagerContinuityUseCase>
  let idProvider: MockProxy<IdProvider>
  let scope: CaseIdentityTransactionScope

  beforeEach(() => {
    collaboratorsRepository = mock<CollaboratorsRepository>()
    authAdministrationProvider = mock<AuthAdministrationProvider>()
    caseIdentityTransaction = mock<CaseIdentityTransaction>()
    ensureContinuity = mock<EnsureCaseManagerContinuityUseCase>()
    idProvider = mock<IdProvider>()
    idProvider.generate.mockReturnValue('operation-id')

    const scopedCollaborators = mock<CollaboratorsRepository>()
    const scopedUsers = mock<UsersRepository>()
    scope = {
      identity: {
        collaboratorsRepository: scopedCollaborators,
        usersRepository: scopedUsers,
        registrationAttemptsRepository: mock(),
      },
      cases: mock(),
    } as CaseIdentityTransactionScope
    caseIdentityTransaction.run.mockImplementation(async (operation) => operation(scope))
  })

  it('checks manager continuity and commits local deactivation before remote ban', async () => {
    const collaborator: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as const
    const user = {
      id: 'user-id',
      email: 'lawyer@example.test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(collaborator)
    scopedUsers.findById.mockResolvedValue(user)
    scopedUsers.updateStatus.mockResolvedValue({ ...user, status: 'disabled' })
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(
      CollaboratorSummaryFaker.legal({ collaboratorId: collaborator.id }),
    )
    const authorizeAdministrator = vi.fn(async (_authUser: AuthUser) => {})
    const useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      authorizeAdministrator,
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await useCase.execute({
      authUser: { id: 'admin-id' },
      collaboratorId: collaborator.id,
    })

    expect(ensureContinuity.executeWithin).toHaveBeenCalledWith(scope, {
      collaboratorId: collaborator.id,
      nextProfile: 'lawyer',
      nextStatus: 'disabled',
      actorId: 'admin-id',
      operationId: 'operation-id',
    })
    expect(scopedUsers.updateStatus).toHaveBeenCalledWith(user.id, 'disabled')
    expect(authAdministrationProvider.setUserBanned).toHaveBeenCalledWith(user.id, true)
  })

  it('does not change local status or call remote Auth when continuity fails', async () => {
    const collaborator: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as const
    const user = {
      id: 'user-id',
      email: 'lawyer@example.test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(collaborator)
    scopedUsers.findById.mockResolvedValue(user)
    ensureContinuity.executeWithin.mockRejectedValue(new CollaboratorNotAuthorizedError())
    const useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      vi.fn(async (_authUser: AuthUser) => undefined),
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({ authUser: { id: 'admin-id' }, collaboratorId: collaborator.id }),
    ).rejects.toBeInstanceOf(CollaboratorNotAuthorizedError)
    expect(scopedUsers.updateStatus).not.toHaveBeenCalled()
    expect(authAdministrationProvider.setUserBanned).not.toHaveBeenCalled()
  })

  it('fails when the collaborator is missing from the transaction', async () => {
    const useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      vi.fn(async () => {}),
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({ authUser: { id: 'admin-id' }, collaboratorId: 'missing' }),
    ).rejects.toBeInstanceOf(CollaboratorNotFoundError)
    expect(authAdministrationProvider.setUserBanned).not.toHaveBeenCalled()
  })

  it('fails when the collaborator has no matching user', async () => {
    const collaborator = {
      id: 'collaborator-id',
      userId: 'missing-user',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Collaborator
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    scopedCollaborators.findById.mockResolvedValue(collaborator)
    const useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      vi.fn(async () => {}),
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({ authUser: { id: 'admin-id' }, collaboratorId: collaborator.id }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
    expect(authAdministrationProvider.setUserBanned).not.toHaveBeenCalled()
  })

  it('skips local deactivation when the user is already disabled', async () => {
    const collaborator: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const user = {
      id: 'user-id',
      email: 'lawyer@example.test',
      status: 'disabled' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(collaborator)
    scopedUsers.findById.mockResolvedValue(user)
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(
      CollaboratorSummaryFaker.legal({ collaboratorId: collaborator.id }),
    )
    const useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      vi.fn(async () => {}),
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await useCase.execute({
      authUser: { id: 'admin-id' },
      collaboratorId: collaborator.id,
    })

    expect(ensureContinuity.executeWithin).not.toHaveBeenCalled()
    expect(scopedUsers.updateStatus).not.toHaveBeenCalled()
    expect(authAdministrationProvider.setUserBanned).toHaveBeenCalledWith(user.id, true)
  })

  it('fails when the local status update cannot find the user', async () => {
    const collaborator: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const user = {
      id: 'user-id',
      email: 'lawyer@example.test',
      status: 'active' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(collaborator)
    scopedUsers.findById.mockResolvedValue(user)
    scopedUsers.updateStatus.mockResolvedValue(undefined)
    const useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      vi.fn(async () => {}),
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({ authUser: { id: 'admin-id' }, collaboratorId: collaborator.id }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
    expect(authAdministrationProvider.setUserBanned).not.toHaveBeenCalled()
  })

  it('fails when the post-deactivation summary cannot be loaded', async () => {
    const collaborator: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const user = {
      id: 'user-id',
      email: 'lawyer@example.test',
      status: 'disabled' as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(collaborator)
    scopedUsers.findById.mockResolvedValue(user)
    collaboratorsRepository.findSummaryByUserId.mockResolvedValue(undefined)
    const useCase = new DeactivateCollaboratorUseCase(
      collaboratorsRepository,
      authAdministrationProvider,
      vi.fn(async () => {}),
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({ authUser: { id: 'admin-id' }, collaboratorId: collaborator.id }),
    ).rejects.toBeInstanceOf(CollaboratorNotFoundError)
    expect(authAdministrationProvider.setUserBanned).toHaveBeenCalledWith(user.id, true)
  })
})
