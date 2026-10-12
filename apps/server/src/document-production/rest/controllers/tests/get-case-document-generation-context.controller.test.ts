import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { GetCaseDocumentGenerationContextController } from '@/document-production/rest/controllers'

describe('Get Case Document Generation Context Controller', () => {
  let fixture: DocumentProductionModuleFixture
  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(
      GetCaseDocumentGenerationContextController,
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('conceals generation context from a collaborator outside the case team', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer, false)
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/document-generation-context`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(403)
  })

  it('allows Admin read context without membership and denies current team members with an ineligible profile', async () => {
    const admin = await fixture.registerAdmin()
    const adminCase = await fixture.createCase(admin, false)
    const adminResponse = await request(fixture.app.getHttpServer())
      .get(`/cases/${adminCase.id}/document-generation-context`)
      .set('Authorization', fixture.authenticateAs(admin))
      .expect(200)
    expect(adminResponse.body).toMatchObject({
      case: { id: adminCase.id, title: adminCase.title },
      canGenerate: expect.any(Boolean),
      documents: expect.any(Array),
      models: expect.any(Array),
    })

    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer)
    await fixture.setCollaboratorProfile(lawyer, 'attendant')
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/document-generation-context`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(403)
  })
})
