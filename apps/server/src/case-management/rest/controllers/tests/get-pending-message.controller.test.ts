import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { GetPendingMessageController } from '@/case-management/rest/controllers/get-pending-message.controller'

describe('Get Pending Message Controller [GET /cases/pendencies/:pendingId/message]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(GetPendingMessageController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns the assisted message for a pending item', async () => {
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
    const { pending, message } = await fixture.registerPending(
      legalCase.id,
      item.id,
      collaborator.collaboratorId,
    )
    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/pendencies/${pending.id}/message`)
      .expect(200)
    expect(response.body).toMatchObject({
      id: message.id,
      pendingId: pending.id,
      subject: 'Documento pendente',
    })
  })

  it('reports a missing message in the current route contract', async () => {
    await fixture.registerCollaborator()
    const response = await request(fixture.app.getHttpServer())
      .get('/cases/pendencies/91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30/message')
      .expect(200)
    expect(response.body.statusCode).toBe(404)
  })
})
