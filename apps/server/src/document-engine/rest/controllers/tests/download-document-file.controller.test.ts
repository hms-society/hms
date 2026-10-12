import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, beforeEach, describe, it } from 'vitest'
import request from 'supertest'
import { DocumentEngineModuleFixture } from '@/document-engine/fixtures/document-engine-module-fixture'
import { DownloadDocumentFileController } from '@/document-engine/rest/controllers/download-document-file.controller'
import { LocalSupabaseStorageFixture } from '@/shared/rest/tests/local-supabase-storage-fixture'

describe('Download Document File Controller [GET /documents/files/:fileId/content]', () => {
  let fixture: DocumentEngineModuleFixture
  let storageFixture: LocalSupabaseStorageFixture

  beforeAll(async () => {
    storageFixture = await LocalSupabaseStorageFixture.start()
    fixture = await DocumentEngineModuleFixture.registerAuthenticated(
      DownloadDocumentFileController,
      randomUUID(),
      (builder) => storageFixture.configure(builder),
    )
  })
  beforeEach(async () => fixture.resetDatabase())
  afterAll(async () => {
    try {
      await fixture?.close()
    } finally {
      await storageFixture?.close()
    }
  })

  it('returns not found for an unknown file without attempting a storage download', async () => {
    const fileId = randomUUID()
    await request(fixture.app.getHttpServer())
      .get(`/documents/files/${fileId}/content`)
      .expect(404)
  })
})
