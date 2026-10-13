import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  DocumentFaker,
  DocumentPackageFaker,
  DocumentSpecificationFaker,
  DocumentVersionFaker,
} from '@hms/core/document-production/domain/entities/fakers'
import { DrizzleCollaboratorsRepository } from '@/identity/database/drizzle/repositories'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { ListCaseDocumentsController } from '@/document-production/rest/controllers'
import { selectDocumentFileVersion } from '@/document-production/rest/controllers/select-document-file-version'

describe('List Case Documents Controller [GET /cases/:caseId/documents]', () => {
  let fixture: DocumentProductionModuleFixture

  beforeAll(async () => {
    fixture = await DocumentProductionModuleFixture.register(ListCaseDocumentsController)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

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
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/40000000-0000-4000-8000-000000000001`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(403)
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/40000000-0000-4000-8000-000000000001/file`)
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

  it('returns persisted pieces with version review details for an authorized case', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer)
    const collaborator = await fixture.app
      .get(DrizzleCollaboratorsRepository)
      .findByUserId(lawyer.id)
    if (!collaborator) throw new Error('Test lawyer collaborator was not created')

    const documentPackageDraft = DocumentPackageFaker.fake({
      context: { type: 'case', caseId: legalCase.id },
    })
    await fixture.packagesRepository.add({
      id: documentPackageDraft.id,
      context: documentPackageDraft.context,
    })

    const specificationDraft = DocumentSpecificationFaker.fake({
      application: { scope: 'global', moment: 'legal_production' },
      status: 'available',
    })
    const specification = await fixture.specificationsRepository.add({
      name: specificationDraft.name,
      description: specificationDraft.description,
      application: specificationDraft.application,
      content: specificationDraft.content,
      variables: specificationDraft.variables,
      status: specificationDraft.status,
    })

    const versionDraft = DocumentVersionFaker.fake({
      documentGenerationId: undefined,
      createdByCollaboratorId: collaborator.id,
      status: 'in_review',
    })
    const version = await fixture.versionsRepository.add(versionDraft)
    const documentDraft = DocumentFaker.fake({
      id: version.documentId,
      title: 'Recurso previdenciário',
      currentVersionId: version.id,
    })
    await fixture.documentsRepository.add(documentDraft)
    await fixture.packageDocumentsRepository.add({
      id: '40000000-0000-4000-8000-000000000001',
      documentPackageId: documentPackageDraft.id,
      documentId: version.documentId,
      documentSpecificationId: specification.id,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(200)

    expect(response.body).toEqual([
      expect.objectContaining({
        id: version.documentId,
        title: 'Recurso previdenciário',
        currentVersionId: version.id,
        versions: [
          expect.objectContaining({
            id: version.id,
            status: 'in_review',
            createdByCollaboratorId: collaborator.id,
            createdByCollaboratorName: collaborator.professionalName,
          }),
        ],
      }),
    ])
  })
})

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
