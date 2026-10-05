import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { DocumentBatchesRepository } from '@hms/core/document-engine/interfaces'
import type { CaseChecklistItemsRepository } from '@hms/core/case-management/interfaces'
import type { StorageProvider } from '@hms/core/shared/interfaces'

import { CaseManagementModuleFixture } from '@/case-management/fixtures/case-management-module-fixture'
import { UploadCasePortalDocumentController } from '@/case-management/rest/controllers/upload-case-portal-document.controller'
import { DOCUMENT_ENGINE } from '@/document-engine/database/drizzle/constants/documents-repositories'
import { CASE_MANAGEMENT_REPOSITORIES } from '@/case-management/constants/case-management-repositories'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'
import { LocalSupabaseStorageFixture } from '@/shared/rest/tests/local-supabase-storage-fixture'
import { InngestFixture } from '@/shared/messaging/inngest/fixtures/inngest-fixture'
import { InngestClient } from '@/shared/messaging/inngest/inngest-client'
import { hashPortalAccessToken } from '@/case-management/security/portal-access-token'

describe('Upload Case Portal Document Controller [POST /cases/:caseId/portal-pendencies/:checklistItemId/upload]', () => {
  let fixture: CaseManagementModuleFixture
  let inngest: InngestFixture
  let storageFixture: LocalSupabaseStorageFixture
  const uploadedPaths: string[] = []
  beforeAll(async () => {
    storageFixture = await LocalSupabaseStorageFixture.start()
    inngest = await InngestFixture.register({ createFunctions: () => [] })
    fixture = await CaseManagementModuleFixture.register(
      UploadCasePortalDocumentController,
      (builder) =>
        storageFixture
          .configure(builder)
          .overrideProvider(InngestClient)
          .useValue(inngest.client),
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => {
    try {
      const storage = fixture?.app.get<StorageProvider>(STORAGE_PROVIDER)
      for (const path of uploadedPaths) await storage?.remove(path)
    } finally {
      try {
        await fixture?.close()
      } finally {
        try {
          await inngest?.close()
        } finally {
          await storageFixture?.close()
        }
      }
    }
  })

  it('uploads a PDF to local Storage and links its persisted batch file', async () => {
    const collaborator = await fixture.registerCollaborator()
    const legalCase = await fixture.registerLegalCase({
      clientId: collaborator.clientId,
      legalAreaId: collaborator.legalAreaId,
      legalTopicId: collaborator.legalTopicId,
    })
    const [item] = await fixture.registerCaseChecklistItems([
      {
        caseId: legalCase.id,
        templateItemKey: 'identity-document',
        title: 'Documento de identidade',
        isRequired: true,
      },
    ])
    await fixture.registerPortalGrant(
      legalCase.id,
      hashPortalAccessToken('upload-test-token'),
      collaborator.collaboratorId,
      true,
    )

    const response = await request(fixture.app.getHttpServer())
      .post(
        `/cases/${legalCase.id}/portal-pendencies/${item.id}/upload?portalToken=upload-test-token`,
      )
      .attach('file', Buffer.from('portal document'), 'documento.pdf')
    expect(response.status, JSON.stringify(response.body)).toBe(201)
    expect(response.body).toMatchObject({
      checklistItemId: item.id,
      status: 'in_analysis',
    })
    const items = await fixture.app
      .get<CaseChecklistItemsRepository>(CASE_MANAGEMENT_REPOSITORIES.caseChecklistItems)
      .listByCaseId(legalCase.id)
    expect(items.find((candidate) => candidate.id === item.id)).toMatchObject({
      status: 'in_analysis',
      documentFileName: 'documento.pdf',
    })
    const batches = await fixture.app
      .get<DocumentBatchesRepository>(DOCUMENT_ENGINE.documentBatches)
      .findById(collaborator.clientId)
    const path = batches[0]?.files?.[0]?.storagePath
    if (!path) throw new Error('Uploaded file path missing')
    uploadedPaths.push(path)
    const storage = fixture.app.get<StorageProvider>(STORAGE_PROVIDER)
    expect(Buffer.from(await storage.download(path))).toEqual(
      Buffer.from('portal document'),
    )
  })
})
