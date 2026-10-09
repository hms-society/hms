import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { CollaboratorSummaryFaker } from '../../domain/entities/fakers'
import type { CollaboratorsRepository, UsersRepository } from '../../interfaces'
import { CollaboratorNotAuthorizedError } from '../../domain/errors'
import { CollaboratorNotFoundError } from '../../domain/errors'
import { GetCollaboratorProfessionalProfileUseCase } from '../get-collaborator-professional-profile-use-case'

describe('GetCollaboratorProfessionalProfileUseCase', () => {
  let usersRepository: MockProxy<UsersRepository>
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>

  beforeEach(() => {
    usersRepository = mock<UsersRepository>()
    collaboratorsRepository = mock<CollaboratorsRepository>()
  })

  it('returns only the professional allowlist for an active legal user', async () => {
    const target = CollaboratorSummaryFaker.legal()
    usersRepository.findById.mockResolvedValue({ id: 'actor', email: 'actor@example.test', status: 'active', createdAt: new Date(), updatedAt: new Date() })
    collaboratorsRepository.findByUserId.mockResolvedValue({
      id: 'actor-collaborator',
      userId: 'actor',
      profile: 'lawyer',
      professionalName: 'Actor',
      jobTitle: 'Advogado',
      legalExpertises: [{ legalAreaId: 'area-id', legalTopicIds: ['topic-id'] }],
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    collaboratorsRepository.findSummaryById.mockResolvedValue(target)
    const useCase = new GetCollaboratorProfessionalProfileUseCase(
      usersRepository,
      collaboratorsRepository,
    )

    await expect(
      useCase.execute({ actorId: 'actor', collaboratorId: target.collaboratorId }),
    ).resolves.toEqual({
      collaboratorId: target.collaboratorId,
      professionalName: target.professionalName,
      email: target.email,
      profile: target.profile,
      legalExpertises: target.legalExpertises,
    })
  })

  it('rejects inactive and non-legal actors before looking up the target', async () => {
    usersRepository.findById.mockResolvedValue({ id: 'actor', email: 'actor@example.test', status: 'disabled', createdAt: new Date(), updatedAt: new Date() })
    const useCase = new GetCollaboratorProfessionalProfileUseCase(
      usersRepository,
      collaboratorsRepository,
    )

    await expect(
      useCase.execute({ actorId: 'actor', collaboratorId: 'target' }),
    ).rejects.toBeInstanceOf(CollaboratorNotAuthorizedError)
    expect(collaboratorsRepository.findSummaryById).not.toHaveBeenCalled()

    usersRepository.findById.mockResolvedValue({ id: 'actor', email: 'actor@example.test', status: 'active', createdAt: new Date(), updatedAt: new Date() })
    collaboratorsRepository.findByUserId.mockResolvedValue({
      id: 'actor-collaborator',
      userId: 'actor',
      profile: 'attendant',
      professionalName: 'Actor',
      jobTitle: 'Atendimento',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    await expect(
      useCase.execute({ actorId: 'actor', collaboratorId: 'target' }),
    ).rejects.toBeInstanceOf(CollaboratorNotAuthorizedError)
    expect(collaboratorsRepository.findSummaryById).not.toHaveBeenCalled()
  })

  it('returns not found for a missing target after authorizing the actor', async () => {
    usersRepository.findById.mockResolvedValue({ id: 'actor', email: 'actor@example.test', status: 'active', createdAt: new Date(), updatedAt: new Date() })
    collaboratorsRepository.findByUserId.mockResolvedValue({
      id: 'actor-collaborator',
      userId: 'actor',
      profile: 'admin',
      professionalName: 'Admin',
      jobTitle: 'Admin',
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    collaboratorsRepository.findSummaryById.mockResolvedValue(undefined)
    const useCase = new GetCollaboratorProfessionalProfileUseCase(
      usersRepository,
      collaboratorsRepository,
    )

    await expect(
      useCase.execute({ actorId: 'actor', collaboratorId: 'missing' }),
    ).rejects.toBeInstanceOf(CollaboratorNotFoundError)
  })
})
