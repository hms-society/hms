import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { CasePortalAccessGrant } from '../../domain/entities'
import { LegalCaseFaker } from '../../domain/entities/fakers'
import type {
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { ListCasePortalAccessUseCase } from '../list-case-portal-access-use-case'

describe('List Case Portal Access Use Case', () => {
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let grantsRepository: MockProxy<CasePortalAccessGrantsRepository>
  let useCase: ListCasePortalAccessUseCase

  beforeEach(() => {
    legalCasesRepository = mock<LegalCasesRepository>()
    grantsRepository = mock<CasePortalAccessGrantsRepository>()
    useCase = new ListCasePortalAccessUseCase(legalCasesRepository, grantsRepository)
  })

  it('lists active links for an administrator', async () => {
    const legalCase = LegalCaseFaker.fake()
    const grants = [grant(legalCase.id)]
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    grantsRepository.findByCaseId.mockResolvedValue(grants)

    await expect(
      useCase.execute({
        caseId: legalCase.id,
        collaboratorId: faker.string.uuid(),
        isAdministrator: true,
      }),
    ).resolves.toEqual(grants)
    expect(grantsRepository.findByCaseId).toHaveBeenCalledWith(legalCase.id)
  })

  it('denies collaborators who are not assigned to the case', async () => {
    const caseId = faker.string.uuid()
    legalCasesRepository.listByTeamMember.mockResolvedValue([])

    await expect(
      useCase.execute({
        caseId,
        collaboratorId: faker.string.uuid(),
        isAdministrator: false,
      }),
    ).rejects.toThrow('O caso não foi encontrado')
    expect(grantsRepository.findByCaseId).not.toHaveBeenCalled()
  })
})

function grant(caseId: string): CasePortalAccessGrant {
  return {
    id: faker.string.uuid(),
    caseId,
    thirdPartyId: faker.string.uuid(),
    tokenHash: faker.string.hexadecimal({ length: 64 }),
    canView: true,
    canViewCaseStatus: true,
    canViewIntakeStatus: false,
    canUpload: false,
    status: 'active',
    grantedBy: faker.string.uuid(),
    createdAt: new Date(),
  }
}
