import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { RevokeCasePortalAccessController } from '@/case-management/rest/controllers/revoke-case-portal-access.controller'

describe('Revoke Case Portal Access Controller [DELETE /cases/:caseId/portal-access/:grantId]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(RevokeCasePortalAccessController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('revokes a persisted grant for a case team member', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: 'lead_lawyer',
        isPrimary: true,
      },
    ])
    const grant = await fixture.registerPortalGrant(
      legalCase.id,
      'test-token-hash',
      collaborator.collaboratorId,
    )
    const response = await request(fixture.app.getHttpServer())
      .delete(`/cases/${legalCase.id}/portal-access/${grant.id}`)
      .expect(200)
    expect(response.body).toMatchObject({
      id: grant.id,
      caseId: legalCase.id,
      status: 'revoked',
    })
    expect(await fixture.findPortalGrant('test-token-hash', legalCase.id)).toBeUndefined()
  })
})
