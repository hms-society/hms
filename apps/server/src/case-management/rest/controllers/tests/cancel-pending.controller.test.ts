import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { CancelPendingController } from '@/case-management/rest/controllers/cancel-pending.controller'

describe('Cancel Pending Controller [POST /cases/pendencies/:pendingId/cancel]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(CancelPendingController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('cancels the pending item with the current collaborator', async () => {
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
      .post(`/cases/pendencies/${pending.id}/cancel`)
      .send({ errorReason: 'Solicitado por engano' })
      .expect(201)
    expect(response.body).toMatchObject({
      id: pending.id,
      cancelledBy: collaborator.collaboratorId,
    })
    expect(response.body.cancelledAt).toBeTruthy()
    expect(message.pendingId).toBe(pending.id)
    expect(await fixture.findPending(pending.id)).toMatchObject({
      cancelledBy: collaborator.collaboratorId,
    })
  })
})
