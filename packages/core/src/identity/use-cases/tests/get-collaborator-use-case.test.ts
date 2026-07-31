import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { CollaboratorSummaryFaker } from '../../domain/entities/fakers'
import { AuthUserFaker } from '../../domain/structures/fakers'
import type { AuthUser } from '../../domain/structures'
import type { CollaboratorsRepository } from '../../interfaces'
import type { UseCase } from '#shared/interfaces/use-case'
import { CollaboratorNotFoundError } from '../../domain/errors'
import { GetCollaboratorUseCase } from '../get-collaborator-use-case'

describe('Get Collaborator Use Case', () => {
  let collaboratorsRepository: MockProxy<CollaboratorsRepository>
  let authorizeAdminUseCase: MockProxy<UseCase<{ authUser: AuthUser }, void>>

  beforeEach(() => {
    collaboratorsRepository = mock<CollaboratorsRepository>()
    authorizeAdminUseCase = mock<UseCase<{ authUser: AuthUser }, void>>()
    authorizeAdminUseCase.execute.mockResolvedValue()
  })

  it('authorizes the administrator and returns the collaborator summary', async () => {
    const authUser = AuthUserFaker.fake()
    const collaborator = CollaboratorSummaryFaker.legal()
    collaboratorsRepository.findSummaryById.mockResolvedValue(collaborator)
    const useCase = new GetCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )

    await expect(
      useCase.execute({ authUser, collaboratorId: collaborator.collaboratorId }),
    ).resolves.toBe(collaborator)

    expect(authorizeAdminUseCase.execute).toHaveBeenCalledWith({ authUser })
    expect(collaboratorsRepository.findSummaryById).toHaveBeenCalledWith(
      collaborator.collaboratorId,
    )
  })

  it('returns not found when the collaborator does not exist', async () => {
    collaboratorsRepository.findSummaryById.mockResolvedValue(undefined)
    const useCase = new GetCollaboratorUseCase(
      collaboratorsRepository,
      authorizeAdminUseCase,
    )

    await expect(
      useCase.execute({
        authUser: AuthUserFaker.fake(),
        collaboratorId: 'missing-collaborator-id',
      }),
    ).rejects.toBeInstanceOf(CollaboratorNotFoundError)
  })
})
