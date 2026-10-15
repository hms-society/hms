import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import { ClientFaker } from '../../../identity/domain/entities/fakers'
import type { ClientsRepository } from '../../../identity/interfaces/clients-repository'
import type { CasePortalAccessGrant } from '../../domain/entities'
import type { LegalCasesRepository } from '../../interfaces'
import { GetThirdPartyPortalCaseUseCase } from '../get-third-party-portal-case-use-case'

describe('Get Third Party Portal Case Use Case', () => {
  it('returns a restricted case summary and upload capability', async () => {
    const legalCase = LegalCaseFaker.fake({ id: 'case-1' })
    const repository = mock<LegalCasesRepository>()
    const clients = mock<ClientsRepository>()
    repository.findById.mockResolvedValue(legalCase)
    clients.findById.mockResolvedValue(
      ClientFaker.fake({ id: legalCase.clientId, name: 'Cliente do portal' }),
    )
    const useCase = new GetThirdPartyPortalCaseUseCase(repository, clients)

    await expect(
      useCase.execute({ caseId: legalCase.id, grant: grantFixture() }),
    ).resolves.toEqual({
      caseId: legalCase.id,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      clientName: 'Cliente do portal',
      status: legalCase.status,
      intakeId: legalCase.intakeId,
      updatedAt: legalCase.updatedAt,
      canUpload: true,
      canViewCaseStatus: true,
      canViewIntakeStatus: true,
    })
  })

  it('hides case status when the link only allows intake visibility', async () => {
    const legalCase = LegalCaseFaker.fake({ id: 'case-1' })
    const repository = mock<LegalCasesRepository>()
    const clients = mock<ClientsRepository>()
    repository.findById.mockResolvedValue(legalCase)
    clients.findById.mockResolvedValue(
      ClientFaker.fake({ id: legalCase.clientId, name: 'Cliente do portal' }),
    )
    const useCase = new GetThirdPartyPortalCaseUseCase(repository, clients)
    const grant = { ...grantFixture(), canViewCaseStatus: false }

    await expect(useCase.execute({ caseId: legalCase.id, grant })).resolves.toMatchObject(
      {
        status: undefined,
        canViewCaseStatus: false,
        canViewIntakeStatus: true,
      },
    )
  })
})

function grantFixture(): CasePortalAccessGrant {
  return {
    id: 'grant-1',
    caseId: 'case-1',
    thirdPartyId: 'third-party-1',
    tokenHash: 'hash',
    canView: true,
    canViewCaseStatus: true,
    canViewIntakeStatus: true,
    canUpload: true,
    status: 'active',
    grantedBy: 'collaborator-1',
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
  }
}
