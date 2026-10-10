import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import {
  DocumentFaker,
  DocumentPackageFaker,
  DocumentSpecificationFaker,
  DocumentVersionFaker,
} from '@hms/core/document-production/domain/entities/fakers'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { DocumentProductionDatabaseModule } from '@/document-production/database/document-production-database.module'
import {
  DrizzleDocumentPackagesRepository,
  DrizzleDocumentSpecificationsRepository,
  DrizzleDocumentVersionsRepository,
  DrizzleDocumentsRepository,
  DrizzlePackageDocumentsRepository,
} from '@/document-production/database/drizzle/repositories'
import { ListCaseDocumentsController } from '@/document-production/rest/controllers/list-case-documents.controller'
import { selectDocumentFileVersion } from '@/document-production/rest/controllers/select-document-file-version'

describe('List Case Documents Controller [GET /cases/:caseId/documents]', () => {
  let fixture: CaseManagementModuleFixture
  let packages: DrizzleDocumentPackagesRepository
  let specifications: DrizzleDocumentSpecificationsRepository
  let versions: DrizzleDocumentVersionsRepository
  let documents: DrizzleDocumentsRepository
  let packageDocuments: DrizzlePackageDocumentsRepository

  beforeAll(async () => {
    fixture = await CaseManagementModuleFixture.register(
      ListCaseDocumentsController,
      (builder) => builder,
      [DocumentProductionDatabaseModule],
    )
    packages = fixture.app.get(DrizzleDocumentPackagesRepository)
    specifications = fixture.app.get(DrizzleDocumentSpecificationsRepository)
    versions = fixture.app.get(DrizzleDocumentVersionsRepository)
    documents = fixture.app.get(DrizzleDocumentsRepository)
    packageDocuments = fixture.app.get(DrizzlePackageDocumentsRepository)
  })

  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => fixture?.close())

  it('returns the persisted pieces and version review details for the case', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const documentPackageDraft = DocumentPackageFaker.fake({
      context: { type: 'case', caseId: legalCase.id },
    })
    await packages.add({
      id: documentPackageDraft.id,
      context: documentPackageDraft.context,
    })

    const specificationDraft = DocumentSpecificationFaker.fake({
      application: { scope: 'global', moment: 'legal_production' },
      status: 'available',
    })
    const specification = await specifications.add({
      name: specificationDraft.name,
      description: specificationDraft.description,
      application: specificationDraft.application,
      content: specificationDraft.content,
      variables: specificationDraft.variables,
      status: specificationDraft.status,
    })

    const versionDraft = DocumentVersionFaker.fake({
      documentGenerationId: undefined,
      createdByCollaboratorId: collaborator.collaboratorId,
      status: 'in_review',
    })
    const version = await versions.add(versionDraft)
    const documentDraft = DocumentFaker.fake({
      id: version.documentId,
      title: 'Recurso previdenciário',
      currentVersionId: version.id,
    })
    await documents.add(documentDraft)
    await packageDocuments.add({
      id: '40000000-0000-4000-8000-000000000001',
      documentPackageId: documentPackageDraft.id,
      documentId: version.documentId,
      documentSpecificationId: specification.id,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents`)
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
            createdByCollaboratorId: collaborator.collaboratorId,
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
