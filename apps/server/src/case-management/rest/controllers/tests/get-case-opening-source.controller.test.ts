import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { GetCaseOpeningSourceController } from '@/case-management/rest/controllers/get-case-opening-source.controller'

describe('Get Case Opening Source Controller [GET /cases/opening-sources/:intakeId]', () => {
  let fixture: CaseManagementModuleFixture
  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(GetCaseOpeningSourceController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('returns only the source reference and selected-field projection', async () => {
    const actor = await fixture.registerCollaborator()
    const intake = await fixture.registerIntake(actor.clientId)

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/opening-sources/${intake.id}`)
      .expect(200)

    expect(response.body).toEqual({ intakeId: intake.id })
    expect(response.body).not.toHaveProperty('clientId')
    expect(response.body).not.toHaveProperty('assignedLawyerId')
  })

  it('returns not found for an unknown Intake', async () => {
    await fixture.registerCollaborator()
    await request(fixture.app.getHttpServer())
      .get('/cases/opening-sources/00000000-0000-4000-8000-000000000099')
      .expect(404)
  })
})
