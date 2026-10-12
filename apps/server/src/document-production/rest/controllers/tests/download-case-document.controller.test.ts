import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import { randomUUID } from 'node:crypto'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { DocumentProductionModuleFixture } from '@/document-production/fixtures'
import { DownloadCaseDocumentController } from '@/document-production/rest/controllers'
import { LocalSupabaseStorageFixture } from '@/shared/rest/tests/local-supabase-storage-fixture'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { LEGAL_CATALOG_REPOSITORIES } from '@/legal-catalog/constants/legal-catalog-repositories'
import { IDENTITY_REPOSITORIES } from '@/identity/constants/identity-repositories'
import type {
  LegalAreasRepository,
  LegalTopicsRepository,
} from '@hms/core/legal-catalog/interfaces'
import type { CollaboratorsRepository } from '@hms/core/identity/interfaces'

describe('Download Case Document Controller [GET /cases/:caseId/documents/:documentId/file]', () => {
  let fixture: DocumentProductionModuleFixture
  let storageFixture: LocalSupabaseStorageFixture
  let uploadedStoragePath: string | undefined
  beforeAll(async () => {
    storageFixture = await LocalSupabaseStorageFixture.start()
    fixture = await DocumentProductionModuleFixture.register(
      DownloadCaseDocumentController,
      (builder) => storageFixture.configure(builder),
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterEach(async () => {
    if (uploadedStoragePath) {
      await fixture.app.get<StorageProvider>(STORAGE_PROVIDER).remove(uploadedStoragePath)
      uploadedStoragePath = undefined
    }
  })
  afterAll(async () => {
    try {
      const storage = fixture?.app.get<StorageProvider>(STORAGE_PROVIDER)
      if (uploadedStoragePath) await storage?.remove(uploadedStoragePath)
    } finally {
      try {
        await fixture?.close()
      } finally {
        await storageFixture?.close()
      }
    }
  })

  it('denies an unassigned collaborator before reading document bytes', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer, false)
    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/${randomUUID()}/file`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(403)
  })

  it('streams the latest PDF version for an authorized case collaborator', async () => {
    const lawyer = await fixture.registerLawyer()
    const legalCase = await fixture.createCase(lawyer)
    const collaborator = await fixture.app
      .get<CollaboratorsRepository>(IDENTITY_REPOSITORIES.collaborators)
      .findByUserId(lawyer.id)
    const legalAreas = await fixture.app
      .get<LegalAreasRepository>(LEGAL_CATALOG_REPOSITORIES.areas)
      .findAll()
    const legalTopics = await fixture.app
      .get<LegalTopicsRepository>(LEGAL_CATALOG_REPOSITORIES.topics)
      .findAllByLegalAreaId(legalAreas.find(({ name }) => name === 'Cível')?.id ?? '')
    const area = legalAreas.find(({ name }) => name === 'Cível')
    const topic = legalTopics.find(({ name }) => name === 'Contratos')
    expect(collaborator).toBeDefined()
    expect(area).toBeDefined()
    expect(topic).toBeDefined()

    const seededDocuments = await fixture.specificationsSeeder.run({
      legalAreas,
      legalTopics: legalTopics.map((legalTopic) => ({
        ...legalTopic,
        legalAreaId: area?.id ?? '',
      })),
      consultationId: randomUUID(),
    })
    const document = seededDocuments.documents[0]
    const specification = seededDocuments.specifications[0]
    expect(document).toBeDefined()
    expect(specification).toBeDefined()

    const documentPackage = await fixture.packagesRepository.add({
      id: randomUUID(),
      context: { type: 'case', caseId: legalCase.id },
    })
    await fixture.packageDocumentsRepository.add({
      id: randomUUID(),
      documentPackageId: documentPackage.id,
      documentId: document?.id ?? '',
      documentSpecificationId: specification?.id ?? '',
    })

    const storagePath = `cases/${legalCase.id}/documents/${document?.id}/${randomUUID()}.pdf`
    const pdfBytes = Buffer.from('%PDF-1.7\ncase document\n%%EOF')
    const storage = fixture.app.get<StorageProvider>(STORAGE_PROVIDER)
    await storage.upload(storagePath, pdfBytes, 'application/pdf')
    uploadedStoragePath = storagePath

    const version = await fixture.versionsRepository.add({
      documentId: document?.id ?? '',
      fileId: randomUUID(),
      storagePath,
      versionNumber: 1,
      source: 'manual',
      content: { type: 'doc' },
      pendingMarkers: [],
      createdByCollaboratorId: collaborator?.id ?? '',
      createdAt: new Date(),
      status: 'in_review',
    })
    await fixture.documentsRepository.replace(document?.id ?? '', {
      currentVersionId: version.id,
    })

    const response = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/${document?.id}/file`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(200)
      .expect('content-type', /application\/pdf/)

    expect(response.body).toEqual(pdfBytes)

    await fixture.versionsRepository.add({
      documentId: document?.id ?? '',
      fileId: randomUUID(),
      versionNumber: 2,
      source: 'manual',
      content: { type: 'doc' },
      pendingMarkers: [],
      createdByCollaboratorId: collaborator?.id ?? '',
      createdAt: new Date(),
      status: 'in_review',
    })

    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/${document?.id}/file`)
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(404)

    const requestedVersion = await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/${document?.id}/file`)
      .query({ versionId: version.id })
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(200)
    expect(requestedVersion.body).toEqual(pdfBytes)

    await request(fixture.app.getHttpServer())
      .get(`/cases/${legalCase.id}/documents/${document?.id}/file`)
      .query({ versionId: randomUUID() })
      .set('Authorization', fixture.authenticateAs(lawyer))
      .expect(404)
  })
})
