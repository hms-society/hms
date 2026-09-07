import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseMemberRole } from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListCaseChecklistController } from '@/case-management/rest/controllers/list-case-checklist.controller'

describe('List Case Checklist Controller [GET /cases/:caseId/checklist]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ListCaseChecklistController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture?.close())

  it('returns the instantiated checklist for a team member', async () => {
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
        role: CaseMemberRole.LeadLawyer,
        isPrimary: true,
      },
    ])
    await fixture.registerCaseChecklistItems([
      {
        caseId: legalCase.id,
        templateItemKey: 'procuracao-assinada',
        title: 'Procuração previdenciária assinada',
        isRequired: true,
      },
    ])

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/checklist`)
      .expect(200)

    expect(response.body).toHaveLength(1)
    expect(response.body).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          caseId: legalCase.id,
          templateItemKey: 'procuracao-assinada',
          status: 'pending',
          isRequired: true,
        }),
      ]),
    )
  })
})
