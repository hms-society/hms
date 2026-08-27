import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'

import { CaseMemberRole } from '@hms/core/case-management/domain/structures'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { CompleteCaseChecklistController } from '@/case-management/rest/controllers/complete-case-checklist.controller'

describe('Complete Case Checklist Controller [PATCH /cases/:caseId/checklist-completion]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(CompleteCaseChecklistController)
  })

  beforeEach(async () => fixture.resetDatabase())

  afterAll(async () => fixture.close())

  it('persists checklist completion for a team member', async () => {
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

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/checklist-completion`)
      .expect(200)

    expect(response.body.checklistCompletedAt).toBeDefined()
    expect(response.body.checklistCompletedBy).toBe(collaborator.collaboratorId)
    expect(response.body.status).toBe('documentation')
  })
})
