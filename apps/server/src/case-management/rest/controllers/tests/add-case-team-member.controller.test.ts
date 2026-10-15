import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { AddCaseTeamMemberController } from '@/case-management/rest/controllers/add-case-team-member.controller'
import { registerManagedCase } from './case-team-controller-test-helpers'

describe('Add Case Team Member Controller [POST /cases/:caseId/team]', () => {
  let fixture: CaseManagementModuleFixture
  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(AddCaseTeamMemberController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('adds a selected eligible collaborator with an operation key and observed version', async () => {
    const { legalCase } = await registerManagedCase(fixture)
    const candidate = await fixture.registerAdditionalCollaborator()
    const input = {
      collaboratorId: candidate.collaboratorId,
      role: 'collaborator',
      operationId: '00000000-0000-4000-8000-000000000101',
      expectedTeamVersion: 0,
    }
    const response = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/team`)
      .send(input)
      .expect(201)
    const replay = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/team`)
      .send(input)
      .expect(201)

    expect(response.body).toMatchObject({ caseId: legalCase.id, teamVersion: 1 })
    expect(replay.body).toEqual(response.body)
    const memberships = await fixture.findCaseMembers(legalCase.id)
    expect(memberships).toHaveLength(2)
    expect((await fixture.listCaseTeamHistory(legalCase.id)).items).toHaveLength(1)
    expect(
      memberships.some(
        (member) =>
          member.collaboratorId === candidate.collaboratorId &&
          member.role === 'collaborator',
      ),
    ).toBe(true)

    const staleVersionCandidate = await fixture.registerAdditionalCollaborator()
    const staleVersionResponse = await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/team`)
      .send({
        collaboratorId: staleVersionCandidate.collaboratorId,
        role: 'collaborator',
        operationId: '00000000-0000-4000-8000-000000000105',
        expectedTeamVersion: 0,
      })
      .expect(409)

    expect(staleVersionResponse.body.statusCode).toBe(409)
    expect(await fixture.findCaseMembers(legalCase.id)).toHaveLength(2)
    expect((await fixture.listCaseTeamHistory(legalCase.id)).items).toHaveLength(1)
  })

  it('rejects a role outside the two-level contract at the request boundary', async () => {
    const { legalCase } = await registerManagedCase(fixture)
    const candidate = await fixture.registerAdditionalCollaborator()
    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/team`)
      .send({
        collaboratorId: candidate.collaboratorId,
        role: 'paralegal',
        operationId: '00000000-0000-4000-8000-000000000102',
        expectedTeamVersion: 0,
      })
      .expect(400)
  })

  it('accepts omitted and short trimmed Admin reasons', async () => {
    const admin = await fixture.registerCollaborator({ profile: 'admin' })
    const legalCase = await fixture.registerLegalCase({
      clientId: admin.clientId,
      legalAreaId: admin.legalAreaId,
      legalTopicId: admin.legalTopicId,
    })
    const manager = await fixture.registerAdditionalCollaborator()
    const collaborator = await fixture.registerAdditionalCollaborator()

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/team`)
      .send({
        collaboratorId: manager.collaboratorId,
        role: 'manager',
        operationId: '00000000-0000-4000-8000-000000000203',
        expectedTeamVersion: 0,
      })
      .expect(201)

    await request(fixture.app.getHttpServer())
      .post(`/cases/${legalCase.id}/team`)
      .send({
        collaboratorId: collaborator.collaboratorId,
        role: 'collaborator',
        operationId: '00000000-0000-4000-8000-000000000204',
        expectedTeamVersion: 1,
        reason: ' ok ',
      })
      .expect(201)

    expect(await fixture.findCaseMembers(legalCase.id)).toHaveLength(2)
    const history = (await fixture.listCaseTeamHistory(legalCase.id)).items
    expect(history).toHaveLength(2)
    expect(history.some((entry) => entry.reason === undefined)).toBe(true)
    expect(history.some((entry) => entry.reason === 'ok')).toBe(true)
  })
})
