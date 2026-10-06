import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { CreatePendingController } from '@/case-management/rest/controllers/create-pending.controller'

describe('Create Pending Controller [POST /cases/:caseId/pendencies]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(CreatePendingController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('creates a pending item and its assisted message', async () => {
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
    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/pendencies`)
      .send({
        checklistItemId: item.id,
        reason: 'missing',
        clientName: 'Cliente HMS Teste',
      })
      .expect(201)
    expect(response.body.pending).toMatchObject({
      caseId: legalCase.id,
      checklistItemId: item.id,
      responsibleId: collaborator.collaboratorId,
      reason: 'missing',
    })
    expect(response.body.message).toMatchObject({
      pendingId: response.body.pending.id,
      status: 'awaiting_approval',
    })
    expect(await fixture.findPending(response.body.pending.id)).toMatchObject({
      caseId: legalCase.id,
      checklistItemId: item.id,
    })
    expect(await fixture.findPendingMessage(response.body.pending.id)).toMatchObject({
      pendingId: response.body.pending.id,
    })
  })

  it('rejects an invalid case identifier', async () => {
    await fixture.registerCollaborator()
    await request(fixture.app.getHttpServer())
      .post('/cases/not-a-uuid/pendencies')
      .send({
        checklistItemId: '91c6e2f4-3a8b-47d1-a5e9-6f2c4b7d8a30',
        reason: 'missing',
      })
      .expect(400)
  })
})
