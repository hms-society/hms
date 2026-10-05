import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CasePortalAccessGrant } from '../../domain/entities'
import type {
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { GrantCasePortalAccessUseCase } from '../grant-case-portal-access-use-case'

describe('Grant Case Portal Access Use Case', () => {
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let grantsRepository: MockProxy<CasePortalAccessGrantsRepository>
  let useCase: GrantCasePortalAccessUseCase

  beforeEach(() => {
    legalCasesRepository = mock<LegalCasesRepository>()
    grantsRepository = mock<CasePortalAccessGrantsRepository>()
    useCase = new GrantCasePortalAccessUseCase(legalCasesRepository, grantsRepository)
  })

  it('allows an administrator to grant access to any existing case', async () => {
    const legalCase = LegalCaseFaker.fake()
    const grant = fakeGrant(legalCase.id)
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    grantsRepository.add.mockResolvedValue(grant)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        collaboratorId: faker.string.uuid(),
        isAdministrator: true,
        tokenHash: faker.string.hexadecimal({ length: 64 }),
        canViewCaseStatus: true,
        canViewIntakeStatus: true,
        canUpload: true,
      }),
    ).resolves.toEqual(grant)

    expect(legalCasesRepository.findById).toHaveBeenCalledWith(legalCase.id)
    expect(legalCasesRepository.listByTeamMember).not.toHaveBeenCalled()
  })

  it('requires non-administrators to be assigned to the case', async () => {
    const legalCase = LegalCaseFaker.fake()
    legalCasesRepository.listByTeamMember.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        collaboratorId: faker.string.uuid(),
        isAdministrator: false,
        tokenHash: faker.string.hexadecimal({ length: 64 }),
        canViewCaseStatus: true,
        canViewIntakeStatus: true,
        canUpload: false,
      }),
    ).rejects.toThrow('O caso não foi encontrado')

    expect(grantsRepository.add).not.toHaveBeenCalled()
  })

  it('associates the access grant with a third party when provided', async () => {
    const legalCase = LegalCaseFaker.fake()
    const grant = fakeGrant(legalCase.id)
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    grantsRepository.add.mockResolvedValue(grant)

    await useCase.execute({
      caseId: legalCase.id,
      thirdPartyId: 'third-party-1',
      collaboratorId: faker.string.uuid(),
      isAdministrator: true,
      tokenHash: faker.string.hexadecimal({ length: 64 }),
      canViewCaseStatus: true,
      canViewIntakeStatus: true,
      canUpload: true,
    })

    expect(grantsRepository.add).toHaveBeenCalledWith(
      expect.objectContaining({ thirdPartyId: 'third-party-1' }),
    )
    expect(grantsRepository.revokeActiveByCaseAndThirdParty).toHaveBeenCalledWith(
      legalCase.id,
      'third-party-1',
    )
  })
})

function fakeGrant(caseId: string): CasePortalAccessGrant {
  return {
    id: faker.string.uuid(),
    caseId,
    tokenHash: faker.string.hexadecimal({ length: 64 }),
    canView: true,
    canViewCaseStatus: true,
    canViewIntakeStatus: true,
    canUpload: true,
    status: 'active',
    grantedBy: faker.string.uuid(),
    createdAt: new Date(),
  }
}
