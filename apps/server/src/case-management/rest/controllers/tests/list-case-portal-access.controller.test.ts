import { describe, expect, it, vi } from 'vitest'

import { ListCasePortalAccessController } from '../list-case-portal-access.controller'

describe('ListCasePortalAccessController', () => {
  it('returns active link permissions without exposing token hashes', async () => {
    const legalCasesRepository = {
      findById: vi.fn().mockResolvedValue({ id: 'case-1' }),
    }
    const grantsRepository = {
      findByCaseId: vi.fn().mockResolvedValue([
        {
          id: 'grant-1',
          caseId: 'case-1',
          thirdPartyId: 'third-party-1',
          tokenHash: 'secret-hash',
          canView: true,
          canViewCaseStatus: false,
          canViewIntakeStatus: true,
          canUpload: false,
          status: 'active',
          grantedBy: 'collaborator-1',
          createdAt: new Date('2026-10-02T10:00:00.000Z'),
        },
      ]),
    }
    const controller = new ListCasePortalAccessController(
      legalCasesRepository as never,
      grantsRepository as never,
    )

    await expect(
      controller.handle('case-1', {
        collaboratorId: 'collaborator-1',
        profile: 'admin',
      } as never),
    ).resolves.toEqual([
      {
        grantId: 'grant-1',
        caseId: 'case-1',
        thirdPartyId: 'third-party-1',
        canUpload: false,
        canViewCaseStatus: false,
        canViewIntakeStatus: true,
        createdAt: '2026-10-02T10:00:00.000Z',
      },
    ])
  })
})
