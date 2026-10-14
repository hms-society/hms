import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest'
import request from 'supertest'
import type { StorageProvider } from '@hms/core/shared/interfaces'
import { DocumentBatchChannel } from '@hms/core/document-engine/domain/structures'

import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { LocalSupabaseStorageFixture } from '@/shared/rest/tests/local-supabase-storage-fixture'
import { STORAGE_PROVIDER } from '@/shared/provision/provision.module'

describe('Get Document File Controller [GET /documents/files/:fileId, GET /documents/files/:fileId/content]', () => {
  let fixture: DocumentEngineModuleFixture
  let storage: StorageProvider
  let storageFixture: LocalSupabaseStorageFixture
  let userId: string
  const uploadedPaths: string[] = []
  beforeAll(async () => {
    storageFixture = await LocalSupabaseStorageFixture.start()
    userId = randomUUID()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      undefined,
      userId,
      (builder) => storageFixture.configure(builder),
    )
    storage = fixture.app.get<StorageProvider>(STORAGE_PROVIDER)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => {
    try {
      for (const path of uploadedPaths) await storage?.remove(path)
    } finally {
      try {
        await fixture?.close()
      } finally {
        await storageFixture?.close()
      }
    }
  })

  it('returns metadata but withholds bytes for a file not linked to a case', async () => {
    const clientId = randomUUID()
    await fixture.seedUserAndClient(userId, clientId)
    const storagePath = `tests/${randomUUID()}/document.pdf`
    await storage.upload(storagePath, Buffer.from('document bytes'), 'application/pdf')
    uploadedPaths.push(storagePath)
    const batch = await fixture.documentBatchesRepository.add({
      readableId: `LOTE-${randomUUID()}`,
      channel: DocumentBatchChannel.InternalUpload,
      sender: 'lawyer@hms.com',
      inTriageBox: false,
      clientId,
      createdBy: userId,
      status: 'identified',
      files: [
        {
          storagePath,
          originalName: 'document.pdf',
          mimeType: 'application/pdf',
          sizeBytes: 14,
        },
      ],
    })
    const fileId = batch.files?.[0]?.id
    expect(fileId).toBeDefined()
    const metadata = await request(fixture.app.getHttpServer())
      .get(`/documents/files/${fileId}`)
      .expect(200)
    expect(metadata.body).toMatchObject({ id: fileId, storagePath })
    await request(fixture.app.getHttpServer())
      .get(`/documents/files/${fileId}/content`)
      .expect(404)
  })

  it('returns not found for an unknown file', async () => {
    await request(fixture.app.getHttpServer())
      .get(`/documents/files/${randomUUID()}`)
      .expect(404)
  })
})
