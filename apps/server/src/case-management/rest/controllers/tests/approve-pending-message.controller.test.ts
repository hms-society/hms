import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ApprovePendingMessageController } from '@/case-management/rest/controllers/approve-pending-message.controller'

describe('Approve Pending Message Controller [POST /cases/pendencies/:pendingId/message/approve]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ApprovePendingMessageController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('approves the assisted message as the current collaborator', async () => {
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
      .post(`/cases/pendencies/${pending.id}/message/approve`)
      .expect(201)
    expect(response.body).toMatchObject({
      id: message.id,
      pendingId: pending.id,
      status: 'sent',
      approvedBy: collaborator.collaboratorId,
    })
    expect(response.body.approvedAt).toBeTruthy()
    expect(await fixture.findPendingMessage(pending.id)).toMatchObject({
      status: 'sent',
      approvedBy: collaborator.collaboratorId,
    })
  })
})
