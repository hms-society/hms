import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { GetCaseDocumentController } from '@/document-production/rest/controllers'

describe('Get Case Document Controller [GET /cases/:caseId/documents/:documentId]', () => {
  let fixture: DocumentProductionModuleFixture
  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(GetCaseDocumentController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('authorizes the actor before looking up a case document', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer, false)
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/${randomUUID()}`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(403)
  })
})
