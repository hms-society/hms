import { faker } from '@faker-js/faker'
import { beforeEach, describe, expect, it } from 'vitest'
import { mock, type MockProxy } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CasePortalAccessGrant, LegalCaseSummary } from '../../domain/entities'
import { LegalCaseStatus } from '../../domain/structures'
import type {
  CasePortalAccessGrantsRepository,
  LegalCasesRepository,
} from '../../interfaces'
import { RevokeCasePortalAccessUseCase } from '../revoke-case-portal-access-use-case'

describe('RevokeCasePortalAccessUseCase', () => {
  let legalCasesRepository: MockProxy<LegalCasesRepository>
  let grantsRepository: MockProxy<CasePortalAccessGrantsRepository>
  let useCase: RevokeCasePortalAccessUseCase

  beforeEach(() => {
    legalCasesRepository = mock<LegalCasesRepository>()
    grantsRepository = mock<CasePortalAccessGrantsRepository>()
    useCase = new RevokeCasePortalAccessUseCase(legalCasesRepository, grantsRepository)
  })

  it('allows an administrator to revoke access to any existing case', async () => {
    const legalCase = LegalCaseFaker.fake()
    const grant: CasePortalAccessGrant = {
      id: faker.string.uuid(),
      caseId: legalCase.id,
      tokenHash: faker.string.hexadecimal({ length: 64 }),
      canView: true,
      canUpload: true,
      status: 'revoked',
      grantedBy: faker.string.uuid(),
      createdAt: new Date(),
    }

    legalCasesRepository.findById.mockResolvedValue(legalCase)
    grantsRepository.revoke.mockResolvedValue(grant)

    const result = await useCase.execute({
      grantId: grant.id,
      caseId: legalCase.id,
      collaboratorId: faker.string.uuid(),
      isAdministrator: true,
    })

    expect(result).toEqual(grant)
    expect(legalCasesRepository.findById).toHaveBeenCalledWith(legalCase.id)
    expect(grantsRepository.revoke).toHaveBeenCalledWith(grant.id, legalCase.id)
  })

  it('allows assigned collaborator to revoke access', async () => {
    const legalCase = LegalCaseFaker.fake()
    const collaboratorId = faker.string.uuid()
    const grant: CasePortalAccessGrant = {
      id: faker.string.uuid(),
      caseId: legalCase.id,
      tokenHash: faker.string.hexadecimal({ length: 64 }),
      canView: true,
      canUpload: true,
      status: 'revoked',
      grantedBy: collaboratorId,
      createdAt: new Date(),
    }

    const caseSummary: LegalCaseSummary = {
      id: legalCase.id,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      status: LegalCaseStatus.Documentation,
      clientName: 'Cliente Teste',
      legalArea: 'Direito Civil',
      legalTopic: 'Locação',
      openedAt: new Date(),
      updatedAt: new Date(),
      checklistGate: legalCase.checklistGate,
      dossierGate: legalCase.dossierGate,
      team: [],
    }

    legalCasesRepository.listByTeamMember.mockResolvedValue([caseSummary])
    grantsRepository.revoke.mockResolvedValue(grant)

    const result = await useCase.execute({
      grantId: grant.id,
      caseId: legalCase.id,
      collaboratorId,
      isAdministrator: false,
    })

    expect(result).toEqual(grant)
    expect(legalCasesRepository.listByTeamMember).toHaveBeenCalledWith(collaboratorId)
    expect(grantsRepository.revoke).toHaveBeenCalledWith(grant.id, legalCase.id)
  })

  it('throws error when collaborator is not assigned to the case', async () => {
    const legalCase = LegalCaseFaker.fake()
    const collaboratorId = faker.string.uuid()

    legalCasesRepository.listByTeamMember.mockResolvedValue([])

    await expect(
      useCase.execute({
        grantId: faker.string.uuid(),
        caseId: legalCase.id,
        collaboratorId,
        isAdministrator: false,
      }),
    ).rejects.toThrow('O caso não foi encontrado')

    expect(grantsRepository.revoke).not.toHaveBeenCalled()
  })

  it('throws error when grant is not found or cannot be revoked', async () => {
    const legalCase = LegalCaseFaker.fake()
    legalCasesRepository.findById.mockResolvedValue(legalCase)
    grantsRepository.revoke.mockResolvedValue(undefined as any)

    await expect(
      useCase.execute({
        grantId: faker.string.uuid(),
        caseId: legalCase.id,
        collaboratorId: faker.string.uuid(),
        isAdministrator: true,
      }),
    ).rejects.toThrow('O caso não foi encontrado')
  })
})
