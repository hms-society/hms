import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { hashPortalAccessToken } from '@/case-management/security/portal-access-token'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListCasePortalPendingChecklistController } from '@/case-management/rest/controllers/list-case-portal-pending-checklist.controller'

describe('List Case Portal Pending Checklist Controller [GET /cases/:caseId/portal-pendencies]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      ListCasePortalPendingChecklistController,
    )
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('lists visible checklist items for an active portal grant', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const [item] = await fixture.registerCaseChecklistItems([
      {
        caseId: legalCase.id,
        templateItemKey: 'identity-document',
        title: 'Documento de identidade',
        isRequired: true,
      },
    ])
    await fixture.registerPortalGrant(
      legalCase.id,
      hashPortalAccessToken('test-token'),
      collaborator.collaboratorId,
      true,
    )
    const response = await request(fixture.app.getHttpServer()).get(
      `/cases/${legalCase.id}/portal-pendencies?portalToken=test-token`,
    )
    expect(response.status, JSON.stringify(response.body)).toBe(200)
    expect(response.body).toEqual([
      expect.objectContaining({ id: item.id, caseId: legalCase.id, status: 'pending' }),
    ])
  })

  it('requires a portal grant', async () => {
    await request(fixture.app.getHttpServer())
      .get('/cases/91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30/portal-pendencies')
      .expect(403)
  })
})
