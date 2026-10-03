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
  const uploadedPaths: string[] = []
  beforeAll(async () => {
    fixture = await DocumentEngineModuleFixture.register(undefined, (builder) =>
      LocalSupabaseStorageFixture.configure(builder),
    )
    storage = fixture.app.get<StorageProvider>(STORAGE_PROVIDER)
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => {
    try {
      for (const path of uploadedPaths) await storage?.remove(path)
    } finally {
      await fixture?.close()
    }
  })

  it('returns metadata from PostgreSQL and bytes from local Supabase Storage', async () => {
    const userId = randomUUID()
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
    const content = await request(fixture.app.getHttpServer())
      .get(`/documents/files/${fileId}/content`)
      .expect(200)
    expect(content.headers['content-type']).toContain('application/pdf')
    expect(content.body).toEqual(Buffer.from('document bytes'))
  })

  it('returns not found for an unknown file', async () => {
    await request(fixture.app.getHttpServer())
      .get(`/documents/files/${randomUUID()}`)
      .expect(404)
  })
})
