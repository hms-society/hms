import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { EnsureCaseManagerContinuityUseCase } from '@hms/core/case-management/use-cases'
import type { LegalExpertiseCatalogProvider } from '@hms/core/legal-catalog/interfaces'
import type { CaseIdentityTransaction, IdProvider } from '#shared/interfaces'
import type { CaseIdentityTransactionScope } from '#shared/interfaces/case-identity-transaction-scope'
import { CollaboratorSummaryFaker } from '../../domain/entities/fakers'
import type { Collaborator } from '../../domain/entities'
import { CollaboratorNotFoundError, UserNotFoundError } from '../../domain/errors'
import { ConflictError } from '../../../shared/domain/errors'
import type { AuthUser } from '../../domain/structures'
import type { CollaboratorsRepository, UsersRepository } from '../../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import { UpdateCollaboratorUseCase } from '../update-collaborator-use-case'

describe('UpdateCollaboratorUseCase', () => {
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let authorizeAdminUseCase: MockProxy<UseCase<{ authUser: AuthUser }, void>>
  let legalExpertiseCatalogProvider: MockProxy<LegalExpertiseCatalogProvider>
  let caseIdentityTransaction: MockProxy<CaseIdentityTransaction>
  let ensureContinuity: MockProxy<EnsureCaseManagerContinuityUseCase>
  let idProvider: MockProxy<IdProvider>
  let scope: CaseIdentityTransactionScope

  beforeEach(() => {
    collaboratorsRepository = mock<CollaboratorsRepository>()
    authorizeAdminUseCase = mock<UseCase<{ authUser: AuthUser }, void>>()
    authorizeAdminUseCase.execute.mockResolvedValue()
    legalExpertiseCatalogProvider = mock<LegalExpertiseCatalogProvider>()
    legalExpertiseCatalogProvider.validateActive.mockResolvedValue(true)
    caseIdentityTransaction = mock<CaseIdentityTransaction>()
    ensureContinuity = mock<EnsureCaseManagerContinuityUseCase>()
    idProvider = mock<IdProvider>()
    idProvider.generate.mockReturnValue('operation-id')

    scope = {
      identity: {
        collaboratorsRepository: mock<CollaboratorsRepository>(),
        usersRepository: mock<UsersRepository>(),
        registrationAttemptsRepository: mock(),
      },
      cases: mock(),
    } as CaseIdentityTransactionScope
    caseIdentityTransaction.run.mockImplementation(async (operation) => operation(scope))
  })

  it('checks manager continuity in the same transaction as a profile update', async () => {
    const current: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(current)
    scopedCollaborators.replace.mockResolvedValue({ ...current, profile: 'supervisor' })
    scopedUsers.findById.mockResolvedValue({
      id: current.userId,
      email: 'lawyer@example.test',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    collaboratorsRepository.findSummaryById.mockResolvedValue(
      CollaboratorSummaryFaker.legal({
        collaboratorId: current.id,
        profile: 'supervisor',
      }),
    )
    const useCase = new UpdateCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
      legalExpertiseCatalogProvider,
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )
    const changes = {
      professionalName: 'Lawyer',
      profile: 'supervisor' as const,
      legalExpertises: [
        { legalAreaId: 'area-id', legalTopicIds: ['topic-id'] as const },
      ] as const,
    }

    await useCase.execute({
      authUser: { id: 'admin-id' },
      collaboratorId: current.id,
      changes,
    })

    expect(ensureContinuity.executeWithin).toHaveBeenCalledWith(scope, {
      collaboratorId: current.id,
      nextProfile: 'supervisor',
      nextStatus: 'active',
      actorId: 'admin-id',
      operationId: 'operation-id',
    })
    expect(scopedCollaborators.replace).toHaveBeenCalled()
  })

  it('does not persist a profile change when continuity rejects it', async () => {
    const current: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'lawyer',
      professionalName: 'Lawyer',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(current)
    scopedUsers.findById.mockResolvedValue({
      id: current.userId,
      email: 'lawyer@example.test',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    ensureContinuity.executeWithin.mockRejectedValue(new ConflictError('Último Gestor'))
    const useCase = new UpdateCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
      legalExpertiseCatalogProvider,
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )
    const changes = {
      professionalName: 'Lawyer',
      profile: 'attendant' as const,
    }

    await expect(
      useCase.execute({
        authUser: { id: 'admin-id' },
        collaboratorId: current.id,
        changes,
      }),
    ).rejects.toBeInstanceOf(ConflictError)
    expect(scopedCollaborators.replace).not.toHaveBeenCalled()
  })

  it('fails when the collaborator is missing from the transaction', async () => {
    const useCase = new UpdateCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
      legalExpertiseCatalogProvider,
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({
        authUser: { id: 'admin-id' },
        collaboratorId: 'missing',
        changes: { professionalName: 'Updated', profile: 'attendant' },
      }),
    ).rejects.toBeInstanceOf(CollaboratorNotFoundError)
  })

  it('fails when the collaborator has no matching user', async () => {
    const current: Collaborator = {
      id: 'collaborator-id',
      userId: 'missing-user',
      profile: 'attendant',
      professionalName: 'Attendant',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    scopedCollaborators.findById.mockResolvedValue(current)
    const useCase = new UpdateCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
      legalExpertiseCatalogProvider,
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({
        authUser: { id: 'admin-id' },
        collaboratorId: current.id,
        changes: { professionalName: 'Updated', profile: 'attendant' },
      }),
    ).rejects.toBeInstanceOf(UserNotFoundError)
  })

  it('replaces same-profile changes without running manager continuity', async () => {
    const current: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'attendant',
      professionalName: 'Attendant',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(current)
    scopedCollaborators.replace.mockResolvedValue({
      ...current,
      professionalName: 'Updated',
    })
    scopedUsers.findById.mockResolvedValue({
      id: current.userId,
      email: 'attendant@example.test',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    collaboratorsRepository.findSummaryById.mockResolvedValue(
      CollaboratorSummaryFaker.fake({ collaboratorId: current.id, profile: 'attendant' }),
    )
    const useCase = new UpdateCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
      legalExpertiseCatalogProvider,
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await useCase.execute({
      authUser: { id: 'admin-id' },
      collaboratorId: current.id,
      changes: { professionalName: ' Updated ', profile: 'attendant' },
    })

    expect(ensureContinuity.executeWithin).not.toHaveBeenCalled()
    expect(scopedCollaborators.replace).toHaveBeenCalledWith(current.id, {
      professionalName: 'Updated',
      profile: 'attendant',
    })
  })

  it('fails when the transactional replacement returns no collaborator', async () => {
    const current: Collaborator = {
      id: 'collaborator-id',
      userId: 'user-id',
      profile: 'attendant',
      professionalName: 'Attendant',
      createdAt: new Date(),
      updatedAt: new Date(),
    }
    const scopedCollaborators = scope.identity
      .collaboratorsRepository as MockProxy<CollaboratorsRepository>
    const scopedUsers = scope.identity.usersRepository as MockProxy<UsersRepository>
    scopedCollaborators.findById.mockResolvedValue(current)
    scopedCollaborators.replace.mockResolvedValue(undefined)
    scopedUsers.findById.mockResolvedValue({
      id: current.userId,
      email: 'attendant@example.test',
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    const useCase = new UpdateCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
      legalExpertiseCatalogProvider,
      caseIdentityTransaction,
      ensureContinuity,
      idProvider,
    )

    await expect(
      useCase.execute({
        authUser: { id: 'admin-id' },
        collaboratorId: current.id,
        changes: { professionalName: 'Updated', profile: 'attendant' },
      }),
    ).rejects.toBeInstanceOf(CollaboratorNotFoundError)
  })
})
