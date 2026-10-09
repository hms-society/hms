import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { GetLegalCaseDetailsController } from '@/case-management/rest/controllers/get-legal-case-details.controller'

describe('Get Legal Case Details Controller [GET /cases/:id]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(GetLegalCaseDetailsController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns the persisted case details', async () => {
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
        role: 'manager',
      },
    ])
    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}`)
      .expect(200)
    expect(response.body).toMatchObject({
      id: legalCase.id,
      clientName: collaborator.clientName,
      legalArea: collaborator.legalAreaName,
      legalTopic: collaborator.legalTopicName,
      team: [
        {
          collaboratorId: collaborator.collaboratorId,
          name: collaborator.professionalName,
          role: 'manager',
        },
      ],
    })
  })
})
