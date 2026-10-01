import { describe, expect, it } from 'vitest'
import { mock } from 'vitest-mock-extended'

import { LegalCaseFaker } from '../../domain/entities/fakers'
import type { CasePortalAccessGrant } from '../../domain/entities'
import type { LegalCasesRepository } from '../../interfaces'
import { GetThirdPartyPortalCaseUseCase } from '../get-third-party-portal-case-use-case'

describe('GetThirdPartyPortalCaseUseCase', () => {
  it('returns a restricted case summary and upload capability', async () => {
    const legalCase = LegalCaseFaker.fake({ id: 'case-1' })
    const repository = mock<LegalCasesRepository>()
    repository.findById.mockResolvedValue(legalCase)
    const useCase = new GetThirdPartyPortalCaseUseCase(repository)

    await expect(
      useCase.execute({ caseId: legalCase.id, grant: grantFixture() }),
    ).resolves.toEqual({
      caseId: legalCase.id,
      publicCode: legalCase.publicCode,
      title: legalCase.title,
      status: legalCase.status,
      intakeId: legalCase.intakeId,
      updatedAt: legalCase.updatedAt,
      canUpload: true,
    })
  })
})

function grantFixture(): CasePortalAccessGrant {
  return {
    id: 'grant-1',
    caseId: 'case-1',
    thirdPartyId: 'third-party-1',
    tokenHash: 'hash',
    canView: true,
    canUpload: true,
    status: 'active',
    grantedBy: 'collaborator-1',
    createdAt: new Date('2026-10-01T10:00:00.000Z'),
  }
}
