import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { ListCaseDocumentsController } from '@/document-production/rest/controllers'

import { DocumentVersionFaker } from '@hms/core/document-production/domain/entities/fakers'

import { selectDocumentFileVersion } from '@/document-production/rest/controllers/select-document-file-version'

describe('selectDocumentFileVersion', () => {
  it('selects the requested version instead of the latest version', () => {
    const requestedVersion = DocumentVersionFaker.fake({
      id: 'version-1',
      versionNumber: 1,
    })
    const latestVersion = DocumentVersionFaker.fake({
      id: 'version-2',
      versionNumber: 2,
    })

    expect(
      selectDocumentFileVersion([requestedVersion, latestVersion], 'version-1'),
    ).toBe(requestedVersion)
  })
})

describe('List Case Documents Controller [GET /cases/:caseId/documents]', () => {
  let fixture: DocumentProductionModuleFixture
  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(ListCaseDocumentsController)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture.close())

  it('requires an authenticated case collaborator before returning the case projection', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer, false)
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents`)
      .expect(401)
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(403)
  })

  it('returns an empty projection for an authorized case without a package', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer)
    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(200)
    expect(response.body).toEqual([])
  })
})
