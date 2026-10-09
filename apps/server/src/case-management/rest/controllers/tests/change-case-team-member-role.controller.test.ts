import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ChangeCaseTeamMemberRoleController } from '@/case-management/rest/controllers/change-case-team-member-role.controller'
import { registerManagedCase } from './case-team-controller-test-helpers'

describe('Change Case Team Member Role Controller [PATCH /cases/:caseId/team/:membershipId/role]', () => {
  let fixture: CaseManagementModuleFixture
  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      ChangeCaseTeamMemberRoleController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('changes the selected membership level and increments the team version', async () => {
    const { legalCase } = await registerManagedCase(fixture)
    const candidate = await fixture.registerAdditionalCollaborator()
    await fixture.registerCaseMembers([
      {
        caseId: legalCase.id,
        collaboratorId: candidate.collaboratorId,
        role: 'collaborator',
      },
    ])
    const [target] = await fixture
      .findCaseMembers(legalCase.id)
      .then((members) =>
        members.filter((member) => member.collaboratorId === candidate.collaboratorId),
      )

    const response = await request(fixture.app.getHttpServer())
      .patch(`/cases/${legalCase.id}/team/${target.id}/role`)
      .send({
        role: 'manager',
        operationId: '00000000-0000-4000-8000-000000000201',
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
      )?.role,
    ).toBe('manager')
  })
})
