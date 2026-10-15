import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { ListCaseTeamCandidatesController } from '@/case-management/rest/controllers/list-case-team-candidates.controller'
import { registerManagedCase } from './case-team-controller-test-helpers'

describe('List Case Team Candidates Controller [GET /cases/team-candidates]', () => {
  let fixture: CaseManagementModuleFixture
  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(ListCaseTeamCandidatesController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns eligible candidates, excluding current team members before paging', async () => {
    const { actor, legalCase } = await registerManagedCase(fixture)
    const candidate = await fixture.registerAdditionalCollaborator()
    const response = await request(fixture.app.getHttpServer())
      .get('/cases/team-candidates')
      .query({ caseId: legalCase.id, page: 1, pageSize: 10 })
      .expect(200)

    expect(response.body.items).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          collaboratorId: candidate.collaboratorId,
          profile: 'lawyer',
        }),
      ]),
    )
    expect(
      response.body.items.map((item: { collaboratorId: string }) => item.collaboratorId),
    ).not.toContain(actor.collaboratorId)
    expect(response.body.total).toBe(response.body.items.length)
  })

  it('rejects a query with an invalid page before looking up candidates', async () => {
    await fixture.registerCollaborator()
    await request(fixture.app.getHttpServer())
      .get('/cases/team-candidates')
      .query({ page: 0, pageSize: 10 })
      .expect(400)
  })
})
