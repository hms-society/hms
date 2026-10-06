import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListCasePendingsController } from '@/case-management/rest/controllers/list-case-pendings.controller'

describe('List Case Pendings Controller [GET /cases/:caseId/pendencies]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ListCasePendingsController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('lists pending items only for the requested case', async () => {
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
      .get(`/cases/${legalCase.id}/pendencies`)
      .expect(200)
    expect(response.body).toEqual([
      expect.objectContaining({
        id: pending.id,
        caseId: legalCase.id,
        checklistItemId: item.id,
      }),
    ])
    expect(message.pendingId).toBe(pending.id)
  })
})
