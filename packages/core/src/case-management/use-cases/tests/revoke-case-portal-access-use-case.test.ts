import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import type { CasePortalAccessGrant, LegalCaseSummary } from '../../domain/entities'
import type {
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { RevokeCasePortalAccessUseCase } from '../revoke-case-portal-access-use-case'

describe('Revoke Case Portal Access Use Case', () => {
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let grantsRepository: MockProxy<CasePortalAccessGrantsRepository>
  let useCase: RevokeCasePortalAccessUseCase

  beforeEach(() => {
    legalCasesRepository = mock<LegalCasesRepository>()
    grantsRepository = mock<CasePortalAccessGrantsRepository>()
    useCase = new RevokeCasePortalAccessUseCase(legalCasesRepository, grantsRepository)
  })

  it('revokes an access grant for an administrator', async () => {
    const legalCase = legalCaseSummary()
    const revokedGrant = grantFixture(legalCase.id)
    legalCasesRepository.findById.mockResolvedValue({ id: legalCase.id } as never)
    grantsRepository.revoke.mockResolvedValue(revokedGrant)

    await expect(
      useCase.execute({
        grantId: revokedGrant.id,
        caseId: legalCase.id,
        collaboratorId: faker.string.uuid(),
        isAdministrator: true,
      }),
    ).resolves.toEqual(revokedGrant)

    expect(grantsRepository.revoke).toHaveBeenCalledWith(revokedGrant.id, legalCase.id)
  })

  it('revokes an access grant for a collaborator assigned to the case', async () => {
    const legalCase = legalCaseSummary()
    const revokedGrant = grantFixture(legalCase.id)
    const collaboratorId = faker.string.uuid()
    legalCasesRepository.listByTeamMember.mockResolvedValue([legalCase])
    grantsRepository.revoke.mockResolvedValue(revokedGrant)

    await expect(
      useCase.execute({
        grantId: revokedGrant.id,
        caseId: legalCase.id,
        collaboratorId,
        isAdministrator: false,
      }),
    ).resolves.toEqual(revokedGrant)

    expect(legalCasesRepository.listByTeamMember).toHaveBeenCalledWith(collaboratorId)
  })
})

function grantFixture(caseId: string): CasePortalAccessGrant {
  return {
    id: faker.string.uuid(),
    caseId,
    tokenHash: faker.string.hexadecimal({ length: 64 }),
    canView: true,
    canViewCaseStatus: true,
    canViewIntakeStatus: false,
    canUpload: true,
    status: 'revoked',
    grantedBy: faker.string.uuid(),
    createdAt: new Date(),
  }
}

function legalCaseSummary(): LegalCaseSummary {
  const now = new Date()
  return {
    id: faker.string.uuid(),
    intakeId: faker.string.uuid(),
    publicCode: `CASE-${faker.string.numeric(4)}`,
    title: 'Caso de teste',
    status: 'documentation',
    teamVersion: 0,
    clientName: 'Cliente de teste',
    legalArea: 'Direito civil',
    legalTopic: 'Contratos',
    openedAt: now,
    updatedAt: now,
    checklistGate: {},
    dossierGate: {},
    team: [],
  }
}
