import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { RemoveCaseTeamMemberController } from '@/case-management/rest/controllers/remove-case-team-member.controller'
import { registerManagedCase } from './case-team-controller-test-helpers'

describe('Remove Case Team Member Controller [DELETE /cases/:caseId/team/:membershipId]', () => {
  let fixture: CaseManagementModuleFixture

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(RemoveCaseTeamMemberController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('removes a selected member and records the change', async () => {
    const { legalCase } = await registerManagedCase(fixture)
    const candidate = await fixture.registerAdditionalCollaborator()
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: candidate.collaboratorId,
        role: 'collaborator',
      },
    ])
    const target = (await fixture.findCaseMembers(legalCase.id)).find(
      (member) => member.collaboratorId === candidate.collaboratorId,
    )
    if (!target) throw new Error('Expected test team member')

    const response = await request(fixture.app.getHttpServer())
      .delete(`/cases/${legalCase.id}/team/${target.id}`)
      .send({
        operationId: '00000000-0000-4000-8000-000000000301',
        expectedTeamVersion: 0,
      })
      .expect(200)

    expect(response.body).toMatchObject({
      caseId: legalCase.id,
      membershipId: target.id,
      teamVersion: 1,
    })
    expect(
      (await fixture.findCaseMembers(legalCase.id)).find(
        (member) => member.id === target.id,
      )?.removedAt,
    ).toBeTruthy()
    expect((await fixture.listCaseTeamHistory(legalCase.id)).items).toHaveLength(1)
  })
})
