import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListMyLegalCasesController } from '@/case-management/rest/controllers/list-my-legal-cases.controller'

describe('List My Legal Cases Controller [GET /cases/my]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ListMyLegalCasesController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('lists only cases assigned to the current collaborator team', async () => {
    const collaborator = await fixture.registerCollaborator()
    const assignedCases = await fixture.registerLegalCases(2)
    const unassignedCase = await fixture.registerLegalCase()

    await fixture.registerCaseMembers(
      assignedCases.map((legalCase, index) => ({
        caseId: legalCase.id,
        collaboratorId: collaborator.collaboratorId,
        role: index === 0 ? 'lead_lawyer' : 'lawyer',
        isPrimary: index === 0,
      })),
    )
    await fixture.registerCaseMembers([
      {
        caseId: unassignedCase.id,
        collaboratorId: '5ec2a203-13ba-4321-8d5c-938ff62f6823',
        role: 'lead_lawyer',
        isPrimary: true,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .get('/cases/my')
      .expect(200)

    expect(response.body).toHaveLength(2)
    const listedCaseIds = response.body.map((legalCase: { id: string }) => legalCase.id)
    expect(listedCaseIds.toSorted()).toEqual(assignedCases.map(({ id }) => id).toSorted())
    const listedCase = response.body.find(
      (legalCase: { id: string }) => legalCase.id === assignedCases[0].id,
    )
    expect(listedCase).toMatchObject({
      clientName: collaborator.clientName,
      legalArea: collaborator.legalAreaName,
      legalTopic: collaborator.legalTopicName,
      team: [
        {
          collaboratorId: collaborator.collaboratorId,
          name: collaborator.professionalName,
          role: 'lead_lawyer',
          isPrimary: true,
        },
      ],
    })
  })
})
