import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseManagementSeeder } from '@/case-management/database/case-management-seeder'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { GetCaseTeamController } from '@/case-management/rest/controllers/get-case-team.controller'
import { registerManagedCase } from './case-team-controller-test-helpers'

describe('Get Case Team Controller [GET /cases/:caseId/team]', () => {
  let fixture: CaseManagementModuleFixture
  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(GetCaseTeamController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns the active team and management capability to an eligible member', async () => {
    const { actor, legalCase } = await registerManagedCase(fixture)
    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/team`)
      .expect(200)
    expect(response.body).toMatchObject({
      caseId: legalCase.id,
      teamVersion: 0,
      total: 1,
      activeManagerCount: 1,
      canManage: true,
      requiresAdministrativeReason: false,
      members: [
        { collaboratorId: actor.collaboratorId, role: 'manager', isEligible: true },
      ],
    })
  })

  it('returns not found for an unknown case', async () => {
    await fixture.registerCollaborator()
    await request(fixture.app.getHttpServer())
      .get('/cases/00000000-0000-4000-8000-000000000099/team')
      .expect(404)
  })

  it('clears managed cases and their team records through the seeder', async () => {
    const { legalCase } = await registerManagedCase(fixture)

    await fixture.app.get(CaseManagementSeeder).clear()

    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/team`)
      .expect(404)
  })
})
