import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { GrantCasePortalAccessController } from '@/case-management/rest/controllers/grant-case-portal-access.controller'

describe('Grant Case Portal Access Controller [POST /cases/:caseId/portal-access]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(GrantCasePortalAccessController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('grants a link to a member of the case team', async () => {
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
    const thirdParty = await fixture.registerThirdParty(collaborator.collaboratorId)
    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/portal-access`)
      .send({
        thirdPartyId: thirdParty.id,
        canUpload: true,
        canViewCaseStatus: true,
        canViewIntakeStatus: true,
      })
      .expect(201)
    expect(response.body).toMatchObject({
      caseId: legalCase.id,
      canUpload: true,
      portalAccessUrl: expect.stringContaining('/third-party-portal/cases/'),
    })
    expect(response.body.accessToken).toBeTruthy()
    expect(response.body.grantId).toBeTruthy()
  })

  it('rejects a missing upload permission', async () => {
    await fixture.registerCollaborator()
    await request(fixture.app.getHttpServer())
      .post('/cases/91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30/portal-access')
      .send({ canUpload: true, canViewCaseStatus: true, canViewIntakeStatus: true })
      .expect(400)
  })
})
