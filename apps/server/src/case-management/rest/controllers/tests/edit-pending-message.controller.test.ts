import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { EditPendingMessageController } from '@/case-management/rest/controllers/edit-pending-message.controller'

describe('Edit Pending Message Controller [PATCH /cases/pendencies/:pendingId/message]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(EditPendingMessageController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('updates the persisted assisted message', async () => {
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
      .patch(`/cases/pendencies/${pending.id}/message`)
      .send({ subject: '  Novo assunto  ', body: '  Nova mensagem  ' })
      .expect(200)
    expect(response.body).toMatchObject({
      id: message.id,
      subject: 'Novo assunto',
      body: 'Nova mensagem',
    })
    expect(await fixture.findPendingMessage(pending.id)).toMatchObject({
      subject: 'Novo assunto',
      body: 'Nova mensagem',
    })
  })
})
